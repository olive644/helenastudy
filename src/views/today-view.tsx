import type { Dispatch } from "react";
import {
  minutesFocusedOn,
  toDateKey,
  type WorkspaceAction,
  type WorkspaceState,
} from "../domain/workspace";
import type { AppView } from "../components/app-navigation";
import { PageHeader } from "../components/app-navigation";

type TodayViewProps = {
  workspace: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
  onNavigate: (view: AppView) => void;
};

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function TodayView({ workspace, dispatch, onNavigate }: TodayViewProps) {
  const now = new Date();
  const today = toDateKey(now);
  const pendingTasks = workspace.tasks.filter((task) => !task.completed);
  const todayEvents = workspace.events
    .filter((event) => event.date === today)
    .sort((left, right) => left.time.localeCompare(right.time));
  const completedHabits = workspace.habits.filter((habit) =>
    habit.completedDates.includes(today),
  ).length;
  const focusMinutes = minutesFocusedOn(workspace, today);
  const subjectName = (subjectId: string) =>
    workspace.subjects.find((subject) => subject.id === subjectId)?.name ?? "Sem matéria";

  return (
    <main className="main-content" id="main-content">
      <PageHeader />
      <header className="view-heading view-heading--today">
        <div>
          <span className="section-label">{formatLongDate(now)}</span>
          <h1>Organize seu dia de estudos.</h1>
          <p>Tarefas, foco, hábitos e anotações reunidos no mesmo lugar.</p>
        </div>
        <img
          className="today-helena"
          src="/helena.svg"
          alt="Helena, a gata preta de olhos amarelos"
          width="116"
          height="134"
        />
      </header>

      <section className="metric-row" aria-label="Resumo de hoje">
        <article>
          <span>Pendências</span>
          <strong>{pendingTasks.length}</strong>
          <small>tarefas abertas</small>
        </article>
        <article>
          <span>Foco</span>
          <strong>{focusMinutes}</strong>
          <small>minutos registrados</small>
        </article>
        <article>
          <span>Hábitos</span>
          <strong>
            {completedHabits}/{workspace.habits.length}
          </strong>
          <small>concluídos hoje</small>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="module-panel module-panel--wide" aria-labelledby="tasks-today-title">
          <div className="module-heading">
            <div>
              <span className="section-label">Prioridades</span>
              <h2 id="tasks-today-title">Próximas tarefas</h2>
            </div>
            <button className="link-button" type="button" onClick={() => onNavigate("planner")}>
              Ver agenda <span aria-hidden="true">→</span>
            </button>
          </div>
          {pendingTasks.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma tarefa pendente.</p>
              <button type="button" onClick={() => onNavigate("planner")}>
                Criar uma tarefa
              </button>
            </div>
          ) : (
            <ul className="check-list">
              {pendingTasks.slice(0, 4).map((task) => (
                <li key={task.id}>
                  <button
                    className="check-button"
                    type="button"
                    aria-label={`Concluir ${task.title}`}
                    onClick={() => dispatch({ type: "task/toggled", id: task.id })}
                  >
                    <span aria-hidden="true">✓</span>
                  </button>
                  <div>
                    <strong>{task.title}</strong>
                    <small>
                      {subjectName(task.subjectId)} ·{" "}
                      {task.dueDate === today ? "Hoje" : task.dueDate}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="module-panel" aria-labelledby="agenda-today-title">
          <div className="module-heading">
            <div>
              <span className="section-label">Agenda</span>
              <h2 id="agenda-today-title">Hoje</h2>
            </div>
          </div>
          {todayEvents.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <p>Seu dia ainda está livre.</p>
              <button type="button" onClick={() => onNavigate("planner")}>
                Adicionar compromisso
              </button>
            </div>
          ) : (
            <ul className="schedule-list">
              {todayEvents.map((event) => (
                <li key={event.id}>
                  <time>{event.time}</time>
                  <div>
                    <strong>{event.title}</strong>
                    <small>{subjectName(event.subjectId)}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="quick-actions" aria-label="Ações rápidas">
          <button type="button" onClick={() => onNavigate("focus")}>
            <b className="quick-action-index">01</b>
            <span>
              <strong>Iniciar foco</strong>
              <small>Abrir cronômetro</small>
            </span>
          </button>
          <button type="button" onClick={() => onNavigate("notes")}>
            <b className="quick-action-index">02</b>
            <span>
              <strong>Nova anotação</strong>
              <small>Abrir cadernos</small>
            </span>
          </button>
          <button type="button" onClick={() => onNavigate("lesson-builder")}>
            <b className="quick-action-index">03</b>
            <span>
              <strong>Plano de aula</strong>
              <small>Organizar conteúdo</small>
            </span>
          </button>
          <button type="button" onClick={() => onNavigate("learn")}>
            <b className="quick-action-index">04</b>
            <span>
              <strong>Revisar</strong>
              <small>Flashcards e questões</small>
            </span>
          </button>
          <button type="button" onClick={() => onNavigate("library")}>
            <b className="quick-action-index">05</b>
            <span>
              <strong>Biblioteca</strong>
              <small>Materiais e cartões</small>
            </span>
          </button>
        </section>
      </div>
    </main>
  );
}
