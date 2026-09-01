import { Camera, PenLine, RotateCw, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { MAX_NOTE_ASSET_DATA_URL_LENGTH } from "../data/local-workspace";
import type { NoteAsset } from "../domain/workspace";

type NoteCaptureToolsProps = {
  onSave: (kind: NoteAsset["kind"], name: string, dataUrl: string) => void;
};

type Point = { x: number; y: number };
type Stroke = { color: string; width: number; points: Point[] };

function canvasPoint(canvas: HTMLCanvasElement, event: PointerEvent<HTMLCanvasElement>): Point {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
  };
}

function renderStrokes(canvas: HTMLCanvasElement, strokes: readonly Stroke[]) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = "#fffdf8";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";

  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    context.beginPath();
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width;
    context.moveTo(stroke.points[0]?.x ?? 0, stroke.points[0]?.y ?? 0);
    for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y);
    context.stroke();
  }
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível abrir esta imagem."));
    image.src = url;
  });
}

function exportWithinLimit(canvas: HTMLCanvasElement, kind: "image/jpeg" | "image/png"): string {
  const qualities = kind === "image/jpeg" ? [0.76, 0.62, 0.48] : [undefined];
  for (const quality of qualities) {
    const dataUrl = canvas.toDataURL(kind, quality);
    if (dataUrl.length <= MAX_NOTE_ASSET_DATA_URL_LENGTH) return dataUrl;
  }
  throw new Error(
    "A imagem ainda ficou grande demais. Fotografe uma área menor e tente novamente.",
  );
}

function DrawingPad({ onSave, onClose }: NoteCaptureToolsProps & { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState("#17151c");
  const [width, setWidth] = useState(5);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) renderStrokes(canvas, strokes);
  }, [strokes]);

  function start(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const point = canvasPoint(canvas, event);
    setStrokes((current) => [...current, { color, width, points: [point] }]);
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = canvasPoint(canvas, event);
    setStrokes((current) => {
      const last = current.at(-1);
      if (!last) return current;
      return [...current.slice(0, -1), { ...last, points: [...last.points, point] }];
    });
  }

  function finish() {
    drawingRef.current = false;
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) {
      setError("Escreva ou desenhe algo antes de salvar.");
      return;
    }
    try {
      onSave("drawing", "Escrita à mão", exportWithinLimit(canvas, "image/png"));
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o desenho.");
    }
  }

  return (
    <>
      <div className="capture-controls">
        <label>
          <span>Cor</span>
          <input
            aria-label="Cor da caneta"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </label>
        <label>
          <span>Espessura</span>
          <select value={width} onChange={(event) => setWidth(Number(event.target.value))}>
            <option value="3">Fina</option>
            <option value="5">Média</option>
            <option value="9">Grossa</option>
          </select>
        </label>
        <button className="secondary-button" type="button" onClick={() => setStrokes([])}>
          <Trash2 size={16} /> Limpar
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        width="1000"
        height="600"
        aria-label="Área de escrita à mão"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
      {error && <p className="capture-error">{error}</p>}
      <div className="capture-footer">
        <small>O desenho fica salvo somente nesta anotação e neste dispositivo.</small>
        <button className="primary-button" type="button" onClick={save}>
          Salvar no caderno
        </button>
      </div>
    </>
  );
}

function Scanner({ onSave, onClose }: NoteCaptureToolsProps & { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<{ url: string; name: string } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [grayscale, setGrayscale] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    void loadImage(source.url)
      .then((image) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;
        const rotated = rotation % 180 !== 0;
        const sourceWidth = rotated ? image.naturalHeight : image.naturalWidth;
        const sourceHeight = rotated ? image.naturalWidth : image.naturalHeight;
        const scale = Math.min(1, 1200 / Math.max(sourceWidth, sourceHeight));
        canvas.width = Math.max(1, Math.round(sourceWidth * scale));
        canvas.height = Math.max(1, Math.round(sourceHeight * scale));
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate((rotation * Math.PI) / 180);
        context.filter = grayscale ? "grayscale(1) contrast(1.14)" : "none";
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        context.drawImage(image, -width / 2, -height / 2, width, height);
        context.restore();
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Não foi possível abrir esta imagem.");
      });
    return () => {
      cancelled = true;
    };
  }, [grayscale, rotation, source]);

  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source.url);
    },
    [source],
  );

  function chooseFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!/^image\/(?:jpeg|png|webp)$/.test(file.type)) {
      setError("Use uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("A imagem original deve ter no máximo 12 MB.");
      return;
    }
    if (source) URL.revokeObjectURL(source.url);
    setSource({ url: URL.createObjectURL(file), name: file.name || "Documento digitalizado" });
    setRotation(0);
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    try {
      onSave("scan", source.name, exportWithinLimit(canvas, "image/jpeg"));
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar a imagem.");
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        aria-label="Fotografar ou escolher documento"
        onChange={(event) => chooseFile(event.target.files?.[0])}
      />
      {!source ? (
        <button className="scanner-drop" type="button" onClick={() => inputRef.current?.click()}>
          <Camera size={28} />
          <strong>Fotografar ou escolher uma imagem</strong>
          <span>No celular, a câmera traseira será oferecida quando o navegador permitir.</span>
        </button>
      ) : (
        <>
          <div className="capture-controls">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setRotation((value) => (value + 90) % 360)}
            >
              <RotateCw size={16} /> Girar
            </button>
            <label className="capture-check">
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(event) => setGrayscale(event.target.checked)}
              />
              <span>Realçar documento</span>
            </label>
            <button
              className="secondary-button"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              Trocar imagem
            </button>
          </div>
          <canvas ref={canvasRef} className="scanner-canvas" aria-label="Prévia do documento" />
        </>
      )}
      {error && <p className="capture-error">{error}</p>}
      {source && (
        <div className="capture-footer">
          <small>
            A imagem é reduzida e permanece somente neste dispositivo. Esta fase não usa OCR.
          </small>
          <button className="primary-button" type="button" onClick={save}>
            Salvar digitalização
          </button>
        </div>
      )}
    </>
  );
}

export function NoteCaptureTools({ onSave }: NoteCaptureToolsProps) {
  const [mode, setMode] = useState<"scan" | "drawing" | null>(null);

  useEffect(() => {
    if (!mode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMode(null);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mode]);

  return (
    <>
      <div className="note-capture-actions" aria-label="Ferramentas da anotação">
        <button className="secondary-button" type="button" onClick={() => setMode("scan")}>
          <Camera size={17} /> Digitalizar
        </button>
        <button className="secondary-button" type="button" onClick={() => setMode("drawing")}>
          <PenLine size={17} /> Escrever à mão
        </button>
      </div>

      {mode &&
        createPortal(
          <div className="capture-layer">
            <button
              className="capture-backdrop"
              type="button"
              aria-label="Fechar ferramenta"
              onClick={() => setMode(null)}
            />
            <section
              className="capture-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="capture-title"
            >
              <header>
                <div>
                  <span>Cadernos</span>
                  <h2 id="capture-title">
                    {mode === "scan" ? "Digitalizar documento" : "Escrever à mão"}
                  </h2>
                </div>
                <button
                  className="sheet-close"
                  type="button"
                  aria-label="Fechar"
                  onClick={() => setMode(null)}
                >
                  <X size={20} />
                </button>
              </header>
              {mode === "scan" ? (
                <Scanner onSave={onSave} onClose={() => setMode(null)} />
              ) : (
                <DrawingPad onSave={onSave} onClose={() => setMode(null)} />
              )}
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}

export default NoteCaptureTools;
