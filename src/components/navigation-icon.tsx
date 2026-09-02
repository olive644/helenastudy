export type NavigationIconName =
  | "today"
  | "planner"
  | "focus"
  | "learn"
  | "habits"
  | "notes"
  | "library"
  | "lesson"
  | "homework"
  | "activity-bank"
  | "more"
  | "close";

type NavigationIconProps = {
  name: NavigationIconName;
};

type IconShape =
  | { kind: "path"; d: string }
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; rx: number }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number };

// Cada glifo usa curvas e círculos generosos — a mesma linguagem redonda e
// amigável dos olhos grandes da Helena — em vez de ícones genéricos de traço reto.
const ICON_SHAPES: Record<NavigationIconName, readonly IconShape[]> = {
  today: [
    { kind: "path", d: "M4 12 12 5 20 12" },
    { kind: "rect", x: 6, y: 12, w: 12, h: 8, rx: 2 },
    { kind: "circle", cx: 12, cy: 16.5, r: 1.6 },
  ],
  planner: [
    { kind: "rect", x: 4, y: 5, w: 16, h: 15, rx: 3 },
    { kind: "line", x1: 8, y1: 3, x2: 8, y2: 7 },
    { kind: "line", x1: 16, y1: 3, x2: 16, y2: 7 },
    { kind: "line", x1: 4, y1: 10, x2: 20, y2: 10 },
    { kind: "circle", cx: 9, cy: 14.5, r: 1.2 },
    { kind: "circle", cx: 15, cy: 14.5, r: 1.2 },
  ],
  focus: [
    { kind: "circle", cx: 12, cy: 13, r: 8 },
    { kind: "line", x1: 9.5, y1: 3, x2: 14.5, y2: 3 },
    { kind: "line", x1: 12, y1: 13, x2: 12, y2: 9 },
    { kind: "line", x1: 12, y1: 13, x2: 15, y2: 13 },
  ],
  learn: [
    { kind: "path", d: "M11 6H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" },
    { kind: "path", d: "M13 6h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" },
    { kind: "line", x1: 12, y1: 6, x2: 12, y2: 20 },
  ],
  habits: [
    {
      kind: "path",
      d: "M12 20.5s-6.8-4-9-8C1 9 3.2 5 6.8 5c2 0 4 1 5.2 3 1.2-2 3.2-3 5.2-3 3.6 0 5.8 4 3.8 7.5-2.2 4-9 8-9 8Z",
    },
  ],
  notes: [
    { kind: "path", d: "M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" },
    { kind: "path", d: "M14 3v4h5" },
    { kind: "line", x1: 8, y1: 13, x2: 15, y2: 13 },
    { kind: "line", x1: 8, y1: 17, x2: 13, y2: 17 },
  ],
  library: [
    { kind: "rect", x: 4, y: 5, w: 4, h: 15, rx: 1.3 },
    { kind: "rect", x: 10, y: 7, w: 4, h: 13, rx: 1.3 },
    { kind: "rect", x: 16, y: 4, w: 4, h: 16, rx: 1.3 },
  ],
  lesson: [
    { kind: "rect", x: 4, y: 4, w: 16, h: 16, rx: 2.5 },
    { kind: "rect", x: 9, y: 2, w: 6, h: 3.5, rx: 1.5 },
    { kind: "line", x1: 7.5, y1: 10.5, x2: 14, y2: 10.5 },
    { kind: "line", x1: 7.5, y1: 14.5, x2: 16.5, y2: 14.5 },
  ],
  homework: [
    { kind: "rect", x: 5, y: 4, w: 14, h: 17, rx: 2.5 },
    { kind: "rect", x: 9, y: 2, w: 6, h: 3.5, rx: 1.5 },
    { kind: "path", d: "M7.5 11.5 9 13l3-3" },
    { kind: "path", d: "M7.5 17 9 18.5l3-3" },
  ],
  "activity-bank": [
    { kind: "ellipse", cx: 12, cy: 16, rx: 5, ry: 4 },
    { kind: "circle", cx: 6, cy: 9, r: 2.1 },
    { kind: "circle", cx: 10.2, cy: 5.8, r: 2.2 },
    { kind: "circle", cx: 13.8, cy: 5.8, r: 2.2 },
    { kind: "circle", cx: 18, cy: 9, r: 2.1 },
  ],
  more: [
    { kind: "circle", cx: 6, cy: 12, r: 1.6 },
    { kind: "circle", cx: 12, cy: 12, r: 1.6 },
    { kind: "circle", cx: 18, cy: 12, r: 1.6 },
  ],
  close: [
    { kind: "line", x1: 6, y1: 6, x2: 18, y2: 18 },
    { kind: "line", x1: 18, y1: 6, x2: 6, y2: 18 },
  ],
};

function renderShape(shape: IconShape, index: number) {
  switch (shape.kind) {
    case "path":
      return <path className="navigation-icon__stroke" d={shape.d} key={index} />;
    case "circle":
      return (
        <circle
          className="navigation-icon__stroke"
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          key={index}
        />
      );
    case "ellipse":
      return (
        <ellipse
          className="navigation-icon__stroke"
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          key={index}
        />
      );
    case "rect":
      return (
        <rect
          className="navigation-icon__stroke"
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          rx={shape.rx}
          key={index}
        />
      );
    case "line":
      return (
        <line
          className="navigation-icon__stroke"
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
          key={index}
        />
      );
  }
}

export function NavigationIcon({ name }: NavigationIconProps) {
  return (
    <span className="navigation-icon" data-icon={name} aria-hidden="true">
      <svg className="navigation-icon__glyph" viewBox="0 0 24 24" focusable="false">
        {ICON_SHAPES[name].map((shape, index) => renderShape(shape, index))}
      </svg>
    </span>
  );
}
