import { useState, type Dispatch, type FormEvent } from "react";
import { PageHeader } from "../components/app-navigation";
import { toDateKey, type WorkspaceAction, type WorkspaceState } from "../domain/workspace";

type PlannerViewProps = {
  workspace: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
};

export function PlannerView({ workspace, dispatch }: PlannerViewProps) {
  const today = toDateKey(new Date());
  const defaultSubject = workspace.subjects[0];
  const [subjectName, setSubjectName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState(today);
  const [taskSubjectId, setTaskSubjectId] = useState(defaultSubject?.id ?? "");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(today);
  const [eventTime, setEventTime] = useState("18:00");
  const [eventSubjectId, setEventSubjectId] = useState(defaultSubject?.id ?? "");

  if (!defaultSubject) return null;

  function addSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = subjectName.trim();
    if (!name) return;
    const colors = ["#cf5f4b", "#247a73", "#a07319", "#4568a8"];
    const color = colors[workspace.subjects.length % colors.length] ?? "#7257e8";
    dispatch({ type: "subject/added", name, color });
    setSubjectName("");
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    dispatch({ type: "task/added", title, subjectId: taskSubjectId, dueDate: taskDate });
    setTaskTitle("");
  }

  function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = eventTitle.trim();
    if (!title) return;
    dispatch({
      type: "event/added",
      title,
      subjectId: eventSubjectId,
      date: eventDate,
      time: eventTime,
    });
    setEventTitle("");
  }

  const orderedTasks = [...workspace.tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const orderedEvents = [...workspace.events].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
  );

  return (
    <main className="main-content" id="main-content">
      <PageHeader />
      <header className="view-heading">
        <span className="section-label">Agenda</span>
        <h1>Planeje sem complicar.</h1>
        <p>Organize tarefas e compromissos por data.</p>
      </header>

      <div className="planner-grid">
        <section className="module-panel" aria-labelledby="new-subject-title">
          <div className="module-heading">
            <h2 id="new-subject-title">Matérias</h2>
            <span>{workspace.subjects.length}</span>
          </div>
          <ul className="subject-list">
            {workspace.subjects.map((item) => (
              <li key={item.id}>
                <span style={{ backgroundColor: item.color }} />
                {item.name}
              </li>
            ))}
          </ul>
          <form className="inline-form" onSubmit={addSubject}>
            <label className="field">
              <span>Nova matéria</span>
              <input
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="Ex.: Matemática"
                required
              />
            </label>
            <button className="icon-button" type="submit" aria-label="Adicionar matéria">
              <span aria-hidden="true">+</span>
            </button>
          </form>
        </section>

        <section className="module-panel" aria-labelledby="new-task-title">
          <div className="module-heading">
            <h2 id="new-task-title">Nova tarefa</h2>
          </div>
          <form className="compact-form" onSubmit={addTask}>
            <label className="field">
              <span>O que precisa ser feito?</span>
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Ex.: Revisar vocabulário"
                required
              />
            </label>
            <label className="field">
              <span>Prazo</span>
              <input
                type="date"
                value={taskDate}
                onChange={(event) => setTaskDate(event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Matéria</span>
              <select
                value={taskSubjectId}
                onChange={(event) => setTaskSubjectId(event.target.value)}
              >
                {workspace.subjects.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit">
              <span aria-hidden="true">+</span> Adicionar tarefa
            </button>
          </form>
        </section>

        <section className="module-panel" aria-labelledby="new-event-title">
          <div className="module-heading">
            <h2 id="new-event-title">Novo compromisso</h2>
          </div>
          <form className="compact-form" onSubmit={addEvent}>
            <label className="field field--full">
              <span>Título</span>
              <input
                value={eventTitle}
                onChange={(event) => setEventTitle(event.target.value)}
                placeholder="Ex.: Aula de conversação"
                required
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Data</span>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span>Horário</span>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(event) => setEventTime(event.target.value)}
                  required
                />
              </label>
            </div>
            <label className="field">
              <span>Matéria</span>
              <select
                value={eventSubjectId}
                onChange={(event) => setEventSubjectId(event.target.value)}
              >
                {workspace.subjects.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="secondary-button" type="submit">
              Adicionar compromisso
            </button>
          </form>
        </section>
      </div>

      <div className="planner-grid planner-grid--lists">
        <section className="module-panel" aria-labelledby="task-list-title">
          <div className="module-heading">
            <h2 id="task-list-title">Tarefas</h2>
            <span>{workspace.tasks.length}</span>
          </div>
          {orderedTasks.length === 0 ? (
            <div className="empty-state">
              <p>As tarefas adicionadas aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="check-list">
              {orderedTasks.map((task) => (
                <li className={task.completed ? "is-complete" : undefined} key={task.id}>
                  <button
                    className="check-button"
                    type="button"
                    aria-label={`${task.completed ? "Reabrir" : "Concluir"} ${task.title}`}
                    onClick={() => dispatch({ type: "task/toggled", id: task.id })}
                  >
                    <span aria-hidden="true">✓</span>
                  </button>
                  <div>
                    <strong>{task.title}</strong>
                    <small>{task.dueDate}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="module-panel" aria-labelledby="event-list-title">
          <div className="module-heading">
            <h2 id="event-list-title">Compromissos</h2>
            <span>{workspace.events.length}</span>
          </div>
          {orderedEvents.length === 0 ? (
            <div className="empty-state">
              <p>Os compromissos adicionados aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="schedule-list schedule-list--dated">
              {orderedEvents.map((event) => (
                <li key={event.id}>
                  <time>{event.time}</time>
                  <div>
                    <strong>{event.title}</strong>
                    <small>{event.date}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
