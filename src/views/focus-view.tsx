import { useEffect, useState, type Dispatch } from "react";
import { PageHeader } from "../components/app-navigation";
import {
  minutesFocusedOn,
  toDateKey,
  type WorkspaceAction,
  type WorkspaceState,
} from "../domain/workspace";

type FocusViewProps = {
  workspace: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
};

const PRESETS = [25, 50] as const;

function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function FocusView({ workspace, dispatch }: FocusViewProps) {
  const defaultSubject = workspace.subjects[0];
  const [subjectId, setSubjectId] = useState(defaultSubject?.id ?? "");
  const [duration, setDuration] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState(duration * 60);
  const [running, setRunning] = useState(false);
  const elapsedSeconds = duration * 60 - secondsRemaining;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  if (!defaultSubject) return null;
  const subject = workspace.subjects.find((item) => item.id === subjectId) ?? defaultSubject;

  function chooseDuration(minutes: number) {
    setDuration(minutes);
    setSecondsRemaining(minutes * 60);
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setSecondsRemaining(duration * 60);
  }

  function finish() {
    if (elapsedSeconds <= 0) return;
    dispatch({
      type: "focus/recorded",
      subjectId,
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      completedAt: new Date().toISOString(),
    });
    reset();
  }

  const todayMinutes = minutesFocusedOn(workspace, toDateKey(new Date()));

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
            <div className="preset-switch" aria-label="Duração da sessão">
              {PRESETS.map((minutes) => (
                <button
                  className={duration === minutes ? "is-active" : undefined}
                  type="button"
                  onClick={() => chooseDuration(minutes)}
                  key={minutes}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>
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
              aria-label="Reiniciar cronômetro"
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
    </main>
  );
}
