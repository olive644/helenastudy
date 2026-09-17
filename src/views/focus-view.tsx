import { Check, Plus } from "lucide-react";
import { useEffect, useState, type CSSProperties, type Dispatch, type FormEvent } from "react";
import { PageHeader } from "../components/app-navigation";
import {
  minutesFocusedOn,
  minutesFocusedForSubject,
  toDateKey,
  type WorkspaceAction,
  type WorkspaceState,
} from "../domain/workspace";

type FocusViewProps = {
  workspace: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
};

const PRESETS = [5, 15, 25, 45, 60] as const;
const FULL_BLOOM_MINUTES = 60;
type TimerMode = "timer" | "pomodoro";
type PomodoroPhase = "focus" | "break";

function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function FocusRose({ progress, wilted }: { progress: number; wilted: boolean }) {
  return (
    <svg
      className={`focus-rose${wilted ? " is-wilted" : ""}`}
      viewBox="0 0 240 250"
      role="img"
      aria-label={wilted ? "Rosa de foco murcha" : "Rosa de foco crescendo"}
      style={{ "--rose-growth": String(0.5 + progress * 0.5) } as CSSProperties}
    >
      <path className="focus-rose__shadow" d="m54 226 69-18 67 20-67 16Z" />
      <g className="focus-rose__plant">
        <path className="focus-rose__stem-shadow" d="m118 211 15-116 13 3-13 116Z" />
        <path className="focus-rose__stem" d="m111 211 14-118 12 4-13 117Z" />
        <path className="focus-rose__leaf focus-rose__leaf--left" d="m119 164-56-39 10 48 45 17Z" />
        <path
          className="focus-rose__leaf-fold focus-rose__leaf-fold--left"
          d="m63 125 56 39-46 9Z"
        />
        <path className="focus-rose__leaf focus-rose__leaf--right" d="m130 143 53-38-9 48-45 18Z" />
        <path
          className="focus-rose__leaf-fold focus-rose__leaf-fold--right"
          d="m183 105-53 38 44 10Z"
        />
        <g className="focus-rose__bloom">
          <path
            className="focus-rose__petal focus-rose__petal--back"
            d="m72 77 22-43 37 27 30-36 19 47-26 28-51 2Z"
          />
          <path
            className="focus-rose__petal focus-rose__petal--left"
            d="m67 74 45-18 12 47-35 25-28-29Z"
          />
          <path
            className="focus-rose__petal focus-rose__petal--right"
            d="m124 57 43 8 22 34-31 31-39-27Z"
          />
          <path
            className="focus-rose__petal focus-rose__petal--front"
            d="m89 82 37-24 35 27-7 42-47 5-25-28Z"
          />
          <path className="focus-rose__petal-fold" d="m89 82 37 20 35-17-35-27Z" />
          <path className="focus-rose__center" d="m107 82 20-11 20 14-7 24-25-2Z" />
        </g>
      </g>
    </svg>
  );
}

function PomodoroApple({ active }: { active: boolean }) {
  return (
    <svg
      className={`pomodoro-apple${active ? " is-active" : ""}`}
      viewBox="0 0 240 250"
      role="img"
      aria-label="Maçã Pomodoro em papel recortado"
    >
      <path className="pomodoro-apple__shadow" d="m42 219 79-18 79 19-78 22Z" />
      <path className="pomodoro-apple__stem" d="m119 53 9-40 17 5-15 40Z" />
      <path className="pomodoro-apple__leaf" d="m130 42 51-23-18 38-36 10Z" />
      <path className="pomodoro-apple__leaf-fold" d="m181 19-51 23 33 15Z" />
      <path
        className="pomodoro-apple__body"
        d="m46 102 30-42 45 10 38-12 38 35 3 62-31 55-49 15-51-19-28-50Z"
      />
      <path className="pomodoro-apple__side" d="m159 58 38 35 3 62-31 55-14-72Z" />
      <path className="pomodoro-apple__light" d="m76 60 45 10-20 57-60 29 5-54Z" />
      <path className="pomodoro-apple__center" d="m101 85 38-2 25 35-10 45-36 24-39-27-5-40Z" />
      <path className="pomodoro-apple__shine" d="m76 92 16-13 11 9-15 27Z" />
    </svg>
  );
}

export function FocusView({ workspace, dispatch }: FocusViewProps) {
  const defaultSubject = workspace.subjects[0];
  const [subjectId, setSubjectId] = useState(defaultSubject?.id ?? "");
  const [mode, setMode] = useState<TimerMode>("timer");
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("focus");
  const [duration, setDuration] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState(duration * 60);
  const [running, setRunning] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [targetMinutes, setTargetMinutes] = useState(300);
  const [deadline, setDeadline] = useState(toDateKey(new Date()));
  const [openedAt] = useState(() => Date.now());
  const elapsedSeconds = duration * 60 - secondsRemaining;

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      if (secondsRemaining > 1) {
        setSecondsRemaining(secondsRemaining - 1);
        return;
      }
      setRunning(false);
      if (mode !== "pomodoro") {
        setSecondsRemaining(0);
        return;
      }
      if (pomodoroPhase === "focus") {
        dispatch({
          type: "focus/recorded",
          subjectId,
          durationMinutes: 25,
          completedAt: new Date().toISOString(),
        });
        setPomodoroPhase("break");
        setDuration(5);
        setSecondsRemaining(5 * 60);
      } else {
        setPomodoroPhase("focus");
        setDuration(25);
        setSecondsRemaining(25 * 60);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [dispatch, mode, pomodoroPhase, running, secondsRemaining, subjectId]);

  if (!defaultSubject) return null;
  const subject = workspace.subjects.find((item) => item.id === subjectId) ?? defaultSubject;

  function chooseDuration(minutes: number) {
    setDuration(minutes);
    setSecondsRemaining(minutes * 60);
    setRunning(false);
  }

  function chooseMode(nextMode: TimerMode) {
    setMode(nextMode);
    setPomodoroPhase("focus");
    chooseDuration(25);
  }

  function reset() {
    setRunning(false);
    setSecondsRemaining(duration * 60);
  }

  function finish() {
    if (elapsedSeconds <= 0) return;
    if (mode === "timer" || pomodoroPhase === "focus") {
      dispatch({
        type: "focus/recorded",
        subjectId,
        durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
        completedAt: new Date().toISOString(),
      });
    }
    reset();
  }

  const todayMinutes = minutesFocusedOn(workspace, toDateKey(new Date()));
  const liveMinutes = elapsedSeconds / 60;
  const bloomProgress = Math.min(1, (todayMinutes + liveMinutes) / FULL_BLOOM_MINUTES);
  const lastSession = workspace.focusSessions.reduce<Date | null>((latest, session) => {
    const completedAt = new Date(session.completedAt);
    return !latest || completedAt > latest ? completedAt : latest;
  }, null);
  const caredToday = todayMinutes > 0;
  const missedYesterday = Boolean(
    lastSession && openedAt - lastSession.getTime() >= 2 * 24 * 60 * 60 * 1000,
  );
  const focusedMinutes = minutesFocusedForSubject(workspace, subject.id);
  const subjectGoals = workspace.goals.filter((goal) => goal.subjectId === subject.id);

  function addGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = goalTitle.trim();
    if (!title) return;
    dispatch({ type: "goal/added", subjectId: subject.id, title, targetMinutes, deadline });
    setGoalTitle("");
  }

  return (
    <main className="main-content" id="main-content">
      <PageHeader />
      <header className="view-heading">
        <span className="section-label">Foco</span>
        <h1>Um período de cada vez.</h1>
        <p>Registre o tempo dedicado a cada matéria sem sair da sua rotina.</p>
      </header>

      <div className="focus-layout">
        <section className="focus-card" aria-labelledby="focus-timer-title">
          <div className="focus-card__topline">
            <label className="focus-subject">
              <span>Matéria</span>
              <select value={subject.id} onChange={(event) => setSubjectId(event.target.value)}>
                {workspace.subjects.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="focus-mode-switch" aria-label="Modo do relógio">
              {(["timer", "pomodoro"] as const).map((item) => (
                <button
                  className={mode === item ? "is-active" : undefined}
                  type="button"
                  onClick={() => chooseMode(item)}
                  key={item}
                >
                  {item === "timer" ? "Temporizador" : "Pomodoro"}
                </button>
              ))}
            </div>
          </div>
          <div className="focus-rose-stage">
            {mode === "timer" ? (
              <FocusRose progress={bloomProgress} wilted={missedYesterday && !caredToday} />
            ) : (
              <PomodoroApple active={running} />
            )}
            <div className="focus-rose-copy">
              <span>
                {mode === "pomodoro"
                  ? pomodoroPhase === "focus"
                    ? "Hora de focar"
                    : "Pausa curta"
                  : caredToday
                    ? "Cuidada hoje"
                    : "Sua flor de foco"}
              </span>
              <strong>
                {mode === "pomodoro"
                  ? pomodoroPhase === "focus"
                    ? "Uma maçã, 25 minutos e uma tarefa de cada vez."
                    : "Respire por 5 minutos. O próximo ciclo já está preparado."
                  : missedYesterday && !caredToday
                    ? "Ela sentiu sua falta. Uma sessão faz a rosa florescer novamente."
                    : caredToday
                      ? "Ela está segura por hoje. Continue para vê-la crescer."
                      : "Comece uma sessão hoje para manter a rosa viva."}
              </strong>
              {mode === "timer" ? (
                <small>
                  {Math.min(FULL_BLOOM_MINUTES, Math.floor(todayMinutes + liveMinutes))}/
                  {FULL_BLOOM_MINUTES} min até florescer por completo
                </small>
              ) : (
                <small>25 min de foco · 5 min de pausa · avanço automático</small>
              )}
            </div>
          </div>
          {mode === "timer" && (
            <div className="timer-picker">
              <label htmlFor="focus-duration">Escolha o tempo</label>
              <input
                id="focus-duration"
                type="range"
                min="1"
                max="120"
                value={duration}
                disabled={running || elapsedSeconds > 0}
                onChange={(event) => chooseDuration(Number(event.target.value))}
                style={{ "--timer-progress": `${(duration / 120) * 100}%` } as CSSProperties}
              />
              <div className="timer-presets" aria-label="Atalhos de duração">
                {PRESETS.map((minutes) => (
                  <button
                    className={duration === minutes ? "is-active" : undefined}
                    type="button"
                    disabled={running || elapsedSeconds > 0}
                    onClick={() => chooseDuration(minutes)}
                    key={minutes}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>
          )}
          <h2 id="focus-timer-title" className="timer" aria-live="polite">
            {formatTimer(secondsRemaining)}
          </h2>
          <p className="timer-status">
            {running
              ? "Sessão em andamento"
              : elapsedSeconds > 0
                ? "Sessão pausada"
                : "Pronto para começar"}
          </p>
          <div className="timer-controls">
            <button
              className="primary-button timer-primary"
              type="button"
              onClick={() => setRunning((current) => !current)}
            >
              <span aria-hidden="true">{running ? "Ⅱ" : "▶"}</span>
              {running ? "Pausar" : elapsedSeconds > 0 ? "Continuar" : "Começar"}
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={reset}
              aria-label="Reiniciar temporizador"
            >
              ↺
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={finish}
              disabled={elapsedSeconds <= 0}
            >
              Encerrar e registrar
            </button>
          </div>
        </section>

        <aside className="focus-aside">
          <article className="module-panel focus-summary">
            <span className="section-label">Hoje</span>
            <strong>{todayMinutes} min</strong>
            <p>de foco registrados neste dispositivo</p>
          </article>
          <article className="module-panel native-notice">
            <strong aria-hidden="true">+</strong>
            <div>
              <h2>Modo sem distrações</h2>
              <p>
                O bloqueio de outros aplicativos será ativado quando a versão mobile nativa estiver
                pronta.
              </p>
            </div>
          </article>
        </aside>
      </div>

      <div className="learn-grid focus-goals">
        <section className="module-panel" aria-labelledby="new-goal-title">
          <div className="module-heading">
            <h2 id="new-goal-title">Nova meta de foco</h2>
          </div>
          <form className="compact-form" onSubmit={addGoal}>
            <label className="field">
              <span>Objetivo</span>
              <input
                value={goalTitle}
                onChange={(event) => setGoalTitle(event.target.value)}
                placeholder="Ex.: Preparar prova final"
                required
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Meta em minutos</span>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={targetMinutes}
                  onChange={(event) => setTargetMinutes(Number(event.target.value))}
                  required
                />
              </label>
              <label className="field">
                <span>Prazo</span>
                <input
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  required
                />
              </label>
            </div>
            <button className="secondary-button" type="submit">
              <Plus size={16} /> Criar meta
            </button>
          </form>
        </section>

        <section className="module-panel goals-panel" aria-labelledby="goal-list-title">
          <div className="module-heading">
            <h2 id="goal-list-title">Metas de foco</h2>
            <span>
              {focusedMinutes} min registrados em {subject.name}
            </span>
          </div>
          {subjectGoals.length === 0 ? (
            <div className="empty-state">
              <p>Crie uma meta para acompanhar seu tempo de foco.</p>
            </div>
          ) : (
            <ul className="goal-list">
              {subjectGoals.map((goal) => {
                const progress = Math.min(
                  100,
                  Math.round((focusedMinutes / goal.targetMinutes) * 100),
                );
                return (
                  <li className={goal.completed ? "is-complete" : undefined} key={goal.id}>
                    <button
                      type="button"
                      aria-label={`${goal.completed ? "Reabrir" : "Concluir"} ${goal.title}`}
                      onClick={() => dispatch({ type: "goal/toggled", id: goal.id })}
                    >
                      <Check size={15} />
                    </button>
                    <div>
                      <strong>{goal.title}</strong>
                      <small>
                        {progress}% · {focusedMinutes}/{goal.targetMinutes} min · até{" "}
                        {goal.deadline}
                      </small>
                      <span>
                        <i style={{ width: `${progress}%` }} />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
