import { ArrowLeft, Check, Copy, DoorOpen, Play, Radio, Users, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  buildLocalRoomJoinUrl,
  isValidLocalRoomCode,
  MAX_ROOM_PARTICIPANTS,
  normalizeLocalRoomCode,
  rankLocalRoomParticipants,
  localRoomPool,
  ROOM_CATEGORIES,
  type LocalRoomParticipant,
  type LocalRoomSettings,
} from "../domain/local-room";
import { selectFallbackEnglishVoice, speakEnglish } from "../data/speech-voice";
import { useLocalRoom } from "../hooks/use-local-room";
import { NavigationIcon } from "./navigation-icon";
import { RoomQrCode } from "./room-qr-code";

const DEFAULT_SETTINGS: LocalRoomSettings = {
  difficulty: "mixed",
  questionCount: 10,
  roundSeconds: 30,
};

const MEDAL_ICON_BY_RANK = ["medal-first", "medal-second", "medal-third"] as const;

// Passos da contagem regressiva antes de liberar a primeira pergunta:
// 3, 2, 1 e "Vai!" (representado por 0), cada um por COUNTDOWN_STEP_MS.
const COUNTDOWN_STEP_MS = 700;

function CountdownOverlay({ value }: { value: number }) {
  return (
    <div className="local-room-countdown" role="status" aria-live="assertive">
      <span key={value} className="local-room-countdown__value">
        {value > 0 ? value : "Vai!"}
      </span>
    </div>
  );
}

// Um portal direto pro <body>, não pro elemento pai mais próximo, porque
// qualquer ancestral com transform (como o hover de .module-panel) vira um
// "containing block" e faz position:fixed grudar nele em vez da tela toda.
function LocalRoomFullscreen({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const root = document.getElementById("root");
    const wasInert = root?.inert ?? false;
    if (root) root.inert = true;
    ref.current?.focus();
    return () => {
      if (root) root.inert = wasInert;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return createPortal(
    <div
      ref={ref}
      className="local-room-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-label="Modo Sala"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
          ) ?? [],
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (!first) {
          event.preventDefault();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === ref.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

type LocalRoomProps = {
  initialJoinCode?: string | undefined;
  onExit?: () => void;
  materials?: { id: string; name: string; cards: { id: string; front: string; back: string }[] }[];
};

function ShareRoom({ code }: { code: string }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "link" | "code" | "manual">("idle");
  const linkInputRef = useRef<HTMLInputElement>(null);
  const joinUrl = buildLocalRoomJoinUrl(window.location.href, code);

  async function copy(value: string, success: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(success);
    } catch {
      setCopyStatus("manual");
      linkInputRef.current?.select();
    }
    window.setTimeout(() => setCopyStatus("idle"), 2500);
  }

  return (
    <div className="local-room-share">
      <RoomQrCode value={joinUrl} />
      <div className="local-room-share__link">
        <p>Escaneie o QR code ou compartilhe o convite:</p>
        <input ref={linkInputRef} aria-label="Link da sala" value={joinUrl} readOnly />
        <div className="local-room-share__actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => void copy(joinUrl, "link")}
          >
            <Copy size={16} /> Copiar link
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void copy(code, "code")}
          >
            <Copy size={16} /> Copiar código
          </button>
        </div>
        <p className="local-room-copy-status" role="status" aria-live="polite">
          {copyStatus === "link"
            ? "Link copiado ✓"
            : copyStatus === "code"
              ? "Código copiado ✓"
              : copyStatus === "manual"
                ? "Selecione e copie o link acima."
                : ""}
        </p>
      </div>
    </div>
  );
}

function playQuestionAudio(text: string) {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  speakEnglish(text, {
    voice: selectFallbackEnglishVoice(voices),
    rate: 0.9,
    onUnavailable: () => {},
  });
}

function Scoreboard({ participants }: { participants: readonly LocalRoomParticipant[] }) {
  const ranked = rankLocalRoomParticipants(participants);
  return (
    <ol className="local-room-scoreboard">
      {ranked.map((participant, index) => (
        <li key={participant.id}>
          <span className="local-room-scoreboard__rank">{index + 1}</span>
          <span>
            {participant.displayName}
            {participant.team ? ` · ${participant.team}` : ""}
            {participant.online === false ? " · ausente" : ""}
          </span>
          <strong>
            {participant.score} <NavigationIcon name="xp" />
          </strong>
        </li>
      ))}
    </ol>
  );
}

function Podium({ participants }: { participants: readonly LocalRoomParticipant[] }) {
  const ranked = rankLocalRoomParticipants(participants);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  return (
    <>
      <ol className="local-room-podium">
        {top3.map((participant, index) => (
          <li
            className={`local-room-podium__place local-room-podium__place--${index + 1}`}
            key={participant.id}
          >
            <NavigationIcon name={MEDAL_ICON_BY_RANK[index]!} />
            <span>{participant.displayName}</span>
            <strong>
              {participant.score} <NavigationIcon name="xp" />
            </strong>
          </li>
        ))}
      </ol>
      {rest.length > 0 && <Scoreboard participants={rest} />}
    </>
  );
}

export function LocalRoom({ initialJoinCode, onExit, materials = [] }: LocalRoomProps) {
  const room = useLocalRoom(initialJoinCode);
  const [code, setCode] = useState(initialJoinCode ?? "");
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [lastResult, setLastResult] = useState<{ correct: boolean; xpChange: number } | undefined>(
    undefined,
  );
  const state = room.state;

  const [appliedJoinCode, setAppliedJoinCode] = useState(false);
  if (initialJoinCode && !appliedJoinCode && room.role === "choose") {
    setAppliedJoinCode(true);
    room.setRole("participant");
  }

  const questionKey = state ? `${state.phase}-${state.questionIndex}` : undefined;
  const [seenQuestionKey, setSeenQuestionKey] = useState(questionKey);
  if (questionKey !== seenQuestionKey) {
    setSeenQuestionKey(questionKey);
    setAnswer("");
    setLastResult(undefined);
  }

  const participantCount = state?.participants.length ?? 0;
  const canJoin = !room.busy && isValidLocalRoomCode(code) && name.trim().length > 0;

  const isPlaying = state?.phase === "playing";
  const questionStartedAt = state?.questionStartedAt ?? 0;
  const roundSeconds = state?.settings.roundSeconds ?? 30;
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, roundSeconds - Math.floor((Date.now() - questionStartedAt) / 1000)),
  );

  // Modo Sala toma a tela toda enquanto estiver aberto, pra ficar bem
  // visível projetado ou compartilhado. Some de novo assim que a pessoa
  // troca de aba/modo e este componente é desmontado.
  useEffect(() => {
    document.body.classList.add("local-room-active");
    return () => {
      document.body.classList.remove("local-room-active");
    };
  }, []);

  // Contagem regressiva (3, 2, 1, Vai!) antes da primeira pergunta de cada
  // sala. Dispara só na transição do lobby pra a rodada, nunca de novo
  // entre perguntas nem se a pessoa entrar com a sala já em andamento.
  const previousPhaseRef = useRef(state?.phase);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    previousPhaseRef.current = state?.phase;
    if (previousPhase === "lobby" && state?.phase === "playing" && state.questionIndex === 0) {
      setCountdownValue(3);
    }
  }, [state?.phase, state?.questionIndex]);
  useEffect(() => {
    if (countdownValue === null) return;
    const timer = window.setTimeout(() => {
      setCountdownValue((current) => (current === null || current <= 0 ? null : current - 1));
    }, COUNTDOWN_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [countdownValue]);

  // Só o navegador do organizador tenta avançar a rodada quando o tempo
  // acaba. Ninguém tem um botão para pular antes disso. Quando todo mundo
  // já respondeu, o próprio servidor avança sozinho (submitRoomAnswer); o
  // "advancing" evita pedidos repetidos enquanto um já está a caminho, e o
  // intervalo de 500ms tenta de novo sozinho se o primeiro pedido falhar
  // por uma pequena diferença entre o relógio do navegador e o do servidor.
  useEffect(() => {
    if (!isPlaying) return;
    let advancing = false;
    const tick = () => {
      const remaining = Math.max(
        0,
        roundSeconds - Math.floor((Date.now() - questionStartedAt) / 1000),
      );
      setSecondsLeft(remaining);
      if (remaining === 0 && room.isHost && !advancing) {
        advancing = true;
        void room.nextQuestion().finally(() => {
          advancing = false;
        });
      }
    };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, questionStartedAt, roundSeconds, room.isHost]);

  function joinRoom(event: FormEvent) {
    event.preventDefault();
    void room.joinRoom(code, name);
  }

  async function submitAnswer(event: FormEvent) {
    event.preventDefault();
    if (!state?.currentQuestion || !answer.trim()) return;
    const result = await room.submitAnswer(state.questionIndex, answer);
    setLastResult(result);
  }

  function exitRoom() {
    room.reset();
    onExit?.();
  }

  if (room.isRestoring)
    return (
      <LocalRoomFullscreen>
        <div className="local-room-restoring" role="status" aria-live="polite">
          <Radio size={34} aria-hidden="true" />
          <h3>Retomando sala…</h3>
          <p>Reconectando você à atividade em andamento.</p>
        </div>
      </LocalRoomFullscreen>
    );

  if (room.role === "choose")
    return (
      <LocalRoomFullscreen>
        {onExit && (
          <button
            className="icon-button local-room-back"
            type="button"
            onClick={onExit}
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="local-room-intro">
          <Radio size={34} />
          <div>
            <h3>Modo Sala</h3>
            <p>Cada aluno entra pelo próprio celular com um código de cinco letras.</p>
          </div>
          <div className="local-room-intro__actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => void room.createRoom(DEFAULT_SETTINGS)}
              disabled={room.busy}
            >
              <Users size={17} /> Criar sala
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => room.setRole("participant")}
            >
              <DoorOpen size={17} /> Entrar com código
            </button>
          </div>
          {room.error && <p role="alert">{room.error}</p>}
        </div>
      </LocalRoomFullscreen>
    );

  if (room.role === "participant" && !state)
    return (
      <LocalRoomFullscreen>
        <form className="local-room-join" onSubmit={joinRoom}>
          <button
            className="secondary-button local-room-back-button"
            type="button"
            onClick={() => (initialJoinCode ? onExit?.() : room.setRole("choose"))}
          >
            <ArrowLeft size={17} /> Voltar
          </button>
          <h3>Entrar em uma sala</h3>
          <p>Peça o código de cinco letras para o professor e digite seu nome.</p>
          <label>
            <span>Código</span>
            <input
              value={code}
              onChange={(event) => setCode(normalizeLocalRoomCode(event.target.value).slice(0, 5))}
              onPaste={(event) => {
                event.preventDefault();
                setCode(normalizeLocalRoomCode(event.clipboardData.getData("text")).slice(0, 5));
              }}
              maxLength={5}
              autoComplete="off"
              inputMode="text"
              className="local-room-code-input"
              placeholder="ABCDE"
              required
            />
          </label>
          <label>
            <span>Nome de exibição</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={24}
              required
            />
          </label>
          {room.error && <p role="alert">{room.error}</p>}
          <button className="primary-button" type="submit" disabled={!canJoin}>
            Entrar
          </button>
        </form>
      </LocalRoomFullscreen>
    );

  if (!state) return null;
  const isHost = room.isHost;
  const answered = state.answeredParticipantIds.includes(room.participantId);
  const questionCount = state.settings.questionCount;
  const pool = localRoomPool(state.settings);
  const availableCount = state.content?.count ?? pool.length;
  const actualCount =
    questionCount === "all" ? availableCount : Math.min(questionCount, availableCount);
  const estimatedMinutes = Math.ceil((actualCount * roundSeconds) / 60);
  const ownParticipant = state.participants.find((p) => p.id === room.participantId);
  const teamScores = ["Roxo", "Amarelo"].map((team) => ({
    team,
    score: state.participants.filter((p) => p.team === team).reduce((sum, p) => sum + p.score, 0),
  }));
  const connectionLabel =
    room.connectionStatus === "online"
      ? "Sala online"
      : room.connectionStatus === "offline"
        ? "Sem conexão"
        : room.connectionStatus === "reconnecting"
          ? "Reconectando…"
          : "Conectando…";

  return (
    <LocalRoomFullscreen>
      {countdownValue !== null && <CountdownOverlay value={countdownValue} />}
      <div className="local-room-session">
        <header className="local-room-session__header">
          <div className="local-room-session__code">
            <span>Sala</span>
            <strong>{state.code}</strong>
          </div>
          <div className="local-room-session__actions">
            <p className={`local-room-connection local-room-connection--${room.connectionStatus}`}>
              <span aria-hidden="true" /> {connectionLabel}
            </p>
            <p>
              <Users size={16} /> {state.participants.length} participantes
            </p>
            <button className="secondary-button" type="button" onClick={exitRoom}>
              <X size={16} /> Sair da sala
            </button>
          </div>
        </header>
        <p className="local-note" role="status" aria-live="polite">
          {state.participants.filter((p) => p.online !== false).length} participantes conectados ·{" "}
          {connectionLabel}
        </p>
        {room.error && <p role="alert">{room.error}</p>}
        {state.settings.teams && (
          <p aria-label="Placar por equipe">
            {teamScores.map((t) => `${t.team}: ${t.score} XP`).join(" · ")}
          </p>
        )}

        {state.phase === "lobby" ? (
          isHost ? (
            <div className="local-room-lobby">
              <div className="local-room-lobby__invite">
                <ShareRoom code={state.code} />
                <section className="local-room-participants" aria-labelledby="participants-title">
                  <div className="local-room-section-heading">
                    <h3 id="participants-title">Participantes</h3>
                    <span>
                      {participantCount}/{MAX_ROOM_PARTICIPANTS}
                    </span>
                  </div>
                  {participantCount === 0 ? (
                    <div className="local-room-participants__empty">
                      <div aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                      <strong>Aguardando participantes…</strong>
                      <p>Compartilhe o código {state.code}. A rodada começa com uma pessoa.</p>
                    </div>
                  ) : (
                    <Scoreboard participants={state.participants} />
                  )}
                </section>
              </div>

              <div className="local-room-settings">
                <h3>Configurar rodada</h3>
                <label>
                  <span>Material da sala</span>
                  <select
                    value={state.settings.subjectName ?? ""}
                    onChange={(event) => {
                      const material = materials.find((item) => item.name === event.target.value);
                      void room.updateSettings(
                        { subjectName: material?.name ?? "", difficulty: "mixed", category: "" },
                        material?.cards.slice(0, 30) ?? [],
                      );
                    }}
                  >
                    <option value="">Catálogo de inglês</option>
                    {materials
                      .filter((item) => item.cards.length)
                      .map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name} · meus cartões
                        </option>
                      ))}
                  </select>
                </label>
                <p className="local-note">
                  Ao selecionar seus cartões, você compartilha até 30 deles nesta sala por quatro
                  horas. Materiais pessoais usam dificuldade média.
                </p>
                <label>
                  <span>Atividade</span>
                  <select
                    value={state.settings.activity ?? "listening"}
                    onChange={(event) =>
                      void room.updateSettings({
                        activity: event.target.value as "listening" | "bingo",
                      })
                    }
                  >
                    <option value="listening">Quiz de escuta</option>
                    <option value="bingo">Bingo de vocabulário</option>
                  </select>
                </label>
                <label>
                  <span>Matéria / tema</span>
                  <select
                    value={state.settings.category ?? ""}
                    disabled={Boolean(state.settings.subjectName)}
                    onChange={(event) => void room.updateSettings({ category: event.target.value })}
                  >
                    <option value="">Inglês · todos os temas</option>
                    {ROOM_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  {availableCount} questões disponíveis neste filtro. Prévia:{" "}
                  {(state.content?.preview ?? pool.slice(0, 3).map((card) => card.front)).join(
                    ", ",
                  ) || "Nenhuma questão"}
                  .
                </p>
                <label>
                  <span>Respostas</span>
                  <select
                    value={state.settings.teams ? "teams" : "individual"}
                    onChange={(event) =>
                      void room.updateSettings({ teams: event.target.value === "teams" })
                    }
                  >
                    <option value="individual">Individuais</option>
                    <option value="teams">Equipes Roxo e Amarelo · soma dos pontos</option>
                  </select>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={state.settings.shuffle !== false}
                    onChange={(event) =>
                      void room.updateSettings({ shuffle: event.target.checked })
                    }
                  />{" "}
                  Embaralhar questões
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={state.settings.allowLateJoin ?? false}
                    onChange={(event) =>
                      void room.updateSettings({ allowLateJoin: event.target.checked })
                    }
                  />{" "}
                  Permitir entrada após iniciar
                </label>
                <label>
                  <span>Dificuldade</span>
                  <select
                    value={state.settings.difficulty}
                    onChange={(event) =>
                      void room.updateSettings({
                        difficulty: event.target.value as LocalRoomSettings["difficulty"],
                      })
                    }
                  >
                    <option value="mixed">
                      Misto ·{" "}
                      {state.content?.difficultyCounts?.mixed ??
                        localRoomPool({ ...state.settings, difficulty: "mixed" }).length}
                    </option>
                    <option value="easy">
                      Fácil ·{" "}
                      {state.content?.difficultyCounts?.easy ??
                        localRoomPool({ ...state.settings, difficulty: "easy" }).length}
                    </option>
                    <option value="medium">
                      Médio ·{" "}
                      {state.content?.difficultyCounts?.medium ??
                        localRoomPool({ ...state.settings, difficulty: "medium" }).length}
                    </option>
                    <option value="hard">
                      Difícil ·{" "}
                      {state.content?.difficultyCounts?.hard ??
                        localRoomPool({ ...state.settings, difficulty: "hard" }).length}
                    </option>
                  </select>
                </label>
                <label>
                  <span>Perguntas</span>
                  <select
                    value={state.settings.questionCount}
                    onChange={(event) =>
                      void room.updateSettings({
                        questionCount:
                          event.target.value === "all"
                            ? "all"
                            : (Number(event.target.value) as 5 | 10 | 15),
                      })
                    }
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="all">Todas</option>
                  </select>
                </label>
                <label>
                  <span>Tempo por pergunta</span>
                  <select
                    value={state.settings.roundSeconds}
                    onChange={(event) =>
                      void room.updateSettings({
                        roundSeconds: Number(
                          event.target.value,
                        ) as LocalRoomSettings["roundSeconds"],
                      })
                    }
                  >
                    <option value="15">15s</option>
                    <option value="30">30s</option>
                    <option value="45">45s</option>
                    <option value="60">60s</option>
                  </select>
                </label>
                <div className="local-room-summary" aria-label="Resumo da rodada">
                  <strong>
                    {state.settings.activity === "bingo" ? "Bingo" : "Quiz de escuta"} ·{" "}
                    {state.settings.subjectName || "vocabulário em inglês"}
                  </strong>
                  <p>
                    {actualCount} perguntas · {state.settings.roundSeconds}s cada
                    {estimatedMinutes ? ` · cerca de ${estimatedMinutes} min` : ""}
                  </p>
                  <small>
                    {state.settings.teams ? "Equipes" : "Respostas individuais"} ·{" "}
                    {state.settings.shuffle === false ? "ordem do catálogo" : "ordem embaralhada"} ·{" "}
                    {state.settings.allowLateJoin ? "entrada aberta" : "entrada fecha ao iniciar"}
                  </small>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  disabled={participantCount === 0 || availableCount === 0}
                  onClick={() => void room.startRound()}
                >
                  <Play size={17} /> Iniciar rodada
                </button>
                {participantCount === 0 && (
                  <p className="local-note">Convide ao menos uma pessoa para liberar o início.</p>
                )}
                {room.error && <p role="alert">{room.error}</p>}
              </div>
            </div>
          ) : (
            <div className="local-room-waiting" role="status">
              <Radio size={28} />
              <h3>Aguardando o início</h3>
              <p>O organizador controla esta sala. Código: {state.code}</p>
            </div>
          )
        ) : state.phase === "playing" && state.currentQuestion ? (
          <div className="local-room-round">
            <div className="local-room-round__progress">
              <span>
                Pergunta {state.questionIndex + 1} de {state.totalQuestions}
              </span>
              <span className="local-room-round__timer">
                <NavigationIcon name="timer" /> {secondsLeft}s
              </span>
            </div>
            {isHost ? (
              <>
                <div className="local-room-round__host-question">
                  <Volume2 size={20} />
                  <span>{state.currentQuestion.front}</span>
                </div>
                <p>
                  {state.answeredParticipantIds.length} de {state.participants.length} já
                  responderam. A rodada passa sozinha quando todo mundo responder ou o tempo acabar.
                </p>
                <Scoreboard participants={state.participants} />
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void room.endRoom()}
                >
                  Encerrar sala
                </button>
              </>
            ) : state.settings.activity === "bingo" ? (
              <div className="local-room-bingo">
                <h3>Complete sua cartela</h3>
                <p>
                  Ouça a palavra e marque a tradução correspondente. Vence quem completar a cartela.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => playQuestionAudio(state.currentQuestion!.front)}
                >
                  <Volume2 size={18} /> Ouvir palavra
                </button>
                <div className="local-room-bingo-grid">
                  {(ownParticipant?.bingoCard ?? []).map((id) => (
                    <button
                      key={id}
                      className="secondary-button"
                      aria-pressed={ownParticipant?.bingoMarks?.includes(id) ?? false}
                      disabled={
                        answered || secondsLeft === 0 || ownParticipant?.bingoMarks?.includes(id)
                      }
                      onClick={() => void room.submitAnswer(state.questionIndex, id)}
                    >
                      {state.bingoWords?.find((word) => word.id === id)?.text ?? id}
                      {ownParticipant?.bingoMarks?.includes(id) ? " ✓" : ""}
                    </button>
                  ))}
                </div>
                <button
                  className="secondary-button"
                  disabled={answered || secondsLeft === 0}
                  onClick={() => void room.submitAnswer(state.questionIndex, "pass")}
                >
                  Não está na minha cartela
                </button>
              </div>
            ) : answered ? (
              <div className="local-room-waiting" role="status">
                {lastResult?.correct ? <Check size={28} /> : <Radio size={28} />}
                <h3>{lastResult?.correct ? "Boa! Resposta certa." : "Resposta enviada."}</h3>
                {lastResult && lastResult.xpChange !== 0 && (
                  <p className="local-room-xp-feedback">
                    <NavigationIcon name="xp" /> {lastResult.xpChange > 0 ? "+" : ""}
                    {lastResult.xpChange} XP
                  </p>
                )}
                <p>Aguardando a próxima pergunta.</p>
              </div>
            ) : (
              <form className="local-room-answer" onSubmit={submitAnswer}>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => playQuestionAudio(state.currentQuestion!.front)}
                >
                  <Volume2 size={18} /> Ouvir de novo
                </button>
                <label>
                  <span>Digite a tradução</span>
                  <input
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    autoFocus
                  />
                </label>
                <button className="primary-button" type="submit">
                  Responder
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="local-room-finished">
            <div className="local-room-waiting" role="status">
              <NavigationIcon name="medal-first" />
              <h3>Sala encerrada</h3>
            </div>
            <Podium participants={state.participants} />
            <button className="secondary-button" type="button" onClick={room.reset}>
              <X size={16} /> Sair
            </button>
          </div>
        )}
      </div>
    </LocalRoomFullscreen>
  );
}
