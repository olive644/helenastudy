import { Check, Plus } from "lucide-react";
import { useState, type Dispatch, type FormEvent } from "react";
import { PageHeader } from "../components/app-navigation";
import {
  dueFlashcards,
  minutesFocusedForSubject,
  toDateKey,
  type FlashcardRating,
  type WorkspaceAction,
  type WorkspaceState,
} from "../domain/workspace";

type LearnViewProps = { workspace: WorkspaceState; dispatch: Dispatch<WorkspaceAction> };

function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ReviewSession({ workspace, dispatch, subjectId }: LearnViewProps & { subjectId: string }) {
  const today = toDateKey(new Date());
  const [queue, setQueue] = useState(() =>
    dueFlashcards(workspace, today)
      .filter((card) => card.subjectId === subjectId)
      .map((card) => card.id),
  );
  const [revealed, setRevealed] = useState(false);
  const card = workspace.flashcards.find((item) => item.id === queue[0]);

  function rate(rating: FlashcardRating) {
    if (!card) return;
    dispatch({ type: "flashcard/reviewed", id: card.id, rating, reviewedOn: today });
    setQueue((current) => current.slice(1));
    setRevealed(false);
  }

  if (!card)
    return (
      <div className="study-finished">
        <Check size={22} />
        <h3>Revisão em dia</h3>
        <p>Nenhum cartão pendente para esta matéria.</p>
      </div>
    );

  return (
    <div className="review-session">
      <div className="study-progress">
        <span>
          {queue.length} pendente{queue.length === 1 ? "" : "s"}
        </span>
      </div>
      <article className="review-card">
        <span>{revealed ? "Resposta" : "Pergunta"}</span>
        <h3>{revealed ? card.back : card.front}</h3>
      </article>
      {revealed ? (
        <div className="rating-row">
          <button type="button" onClick={() => rate("again")}>
            Errei
          </button>
          <button type="button" onClick={() => rate("hard")}>
            Difícil
          </button>
          <button type="button" onClick={() => rate("easy")}>
            Fácil
          </button>
        </div>
      ) : (
        <button
          className="primary-button study-main-action"
          type="button"
          onClick={() => setRevealed(true)}
        >
          Mostrar resposta
        </button>
      )}
    </div>
  );
}

function QuizSession({ workspace, dispatch, subjectId }: LearnViewProps & { subjectId: string }) {
  const cards = workspace.flashcards.filter((card) => card.subjectId === subjectId).slice(0, 5);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [finished, setFinished] = useState(false);
  const card = cards[index];

  if (cards.length === 0)
    return (
      <div className="study-finished">
        <h3>Questionário indisponível</h3>
        <p>Crie flashcards na Biblioteca para gerar perguntas locais.</p>
      </div>
    );

  if (finished)
    return (
      <div className="study-finished">
        <strong>
          {correct}/{cards.length}
        </strong>
        <h3>Questionário concluído</h3>
        <p>O resultado foi salvo no seu histórico local.</p>
      </div>
    );
  if (!card) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!card) return;
    if (feedback) {
      const nextIndex = index + 1;
      if (nextIndex >= cards.length) {
        dispatch({
          type: "quiz/recorded",
          subjectId,
          correct,
          total: cards.length,
          completedAt: new Date().toISOString(),
        });
        setFinished(true);
      } else {
        setIndex(nextIndex);
        setAnswer("");
        setFeedback(null);
      }
      return;
    }

    const isCorrect = normalizeAnswer(answer) === normalizeAnswer(card.back);
    if (isCorrect) setCorrect((value) => value + 1);
    setFeedback(isCorrect ? "correct" : "wrong");
  }

  return (
    <form className="quiz-session" onSubmit={submit}>
      <div className="study-progress">
        <span>
          Questão {index + 1} de {cards.length}
        </span>
      </div>
      <h3>{card.front}</h3>
      <label className="field">
        <span>Sua resposta</span>
        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={feedback !== null}
          required
        />
      </label>
      {feedback && (
        <p
          className={feedback === "correct" ? "quiz-feedback is-correct" : "quiz-feedback is-wrong"}
        >
          {feedback === "correct" ? "Resposta correta." : `Resposta esperada: ${card.back}`}
        </p>
      )}
      <button className="secondary-button" type="submit">
        {feedback
          ? index + 1 === cards.length
            ? "Ver resultado"
            : "Próxima questão"
          : "Responder"}
      </button>
    </form>
  );
}

export function LearnView({ workspace, dispatch }: LearnViewProps) {
  const defaultSubject = workspace.subjects[0];
  const [subjectId, setSubjectId] = useState(defaultSubject?.id ?? "");
  const [mode, setMode] = useState<"review" | "quiz">("review");
  const [goalTitle, setGoalTitle] = useState("");
  const [targetMinutes, setTargetMinutes] = useState(300);
  const [deadline, setDeadline] = useState(toDateKey(new Date()));

  if (!defaultSubject) return null;
  const selectedSubject =
    workspace.subjects.find((subject) => subject.id === subjectId) ?? defaultSubject;
  const focusedMinutes = minutesFocusedForSubject(workspace, selectedSubject.id);

  function addGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = goalTitle.trim();
    if (!title) return;
    dispatch({ type: "goal/added", subjectId: selectedSubject.id, title, targetMinutes, deadline });
    setGoalTitle("");
  }

  return (
    <main className="main-content" id="main-content">
      <PageHeader />
      <header className="view-heading view-heading--with-action">
        <div>
          <span className="section-label">Aprender</span>
          <h1>Pratique para lembrar.</h1>
          <p>
            Revise cartões, responda questões e acompanhe metas usando somente seus dados locais.
          </p>
        </div>
        <label className="view-select">
          <span>Matéria</span>
          <select value={selectedSubject.id} onChange={(event) => setSubjectId(event.target.value)}>
            {workspace.subjects.map((subject) => (
              <option value={subject.id} key={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="learn-grid">
        <section className="module-panel study-panel" aria-labelledby="study-mode-title">
          <div className="module-heading">
            <h2 id="study-mode-title">Sessão de estudo</h2>
            <div className="mode-switch">
              <button
                className={mode === "review" ? "is-active" : undefined}
                type="button"
                onClick={() => setMode("review")}
              >
                Revisão
              </button>
              <button
                className={mode === "quiz" ? "is-active" : undefined}
                type="button"
                onClick={() => setMode("quiz")}
              >
                Questionário
              </button>
            </div>
          </div>
          {mode === "review" ? (
            <ReviewSession
              key={`review-${selectedSubject.id}`}
              workspace={workspace}
              dispatch={dispatch}
              subjectId={selectedSubject.id}
            />
          ) : (
            <QuizSession
              key={`quiz-${selectedSubject.id}`}
              workspace={workspace}
              dispatch={dispatch}
              subjectId={selectedSubject.id}
            />
          )}
        </section>

        <section className="module-panel" aria-labelledby="new-goal-title">
          <div className="module-heading">
            <h2 id="new-goal-title">Nova meta</h2>
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
      </div>

      <section className="module-panel goals-panel" aria-labelledby="goal-list-title">
        <div className="module-heading">
          <h2 id="goal-list-title">Metas de estudo</h2>
          <span>
            {focusedMinutes} min registrados em {selectedSubject.name}
          </span>
        </div>
        {workspace.goals.filter((goal) => goal.subjectId === selectedSubject.id).length === 0 ? (
          <div className="empty-state">
            <p>Crie uma meta para relacionar seu tempo de foco a um objetivo.</p>
          </div>
        ) : (
          <ul className="goal-list">
            {workspace.goals
              .filter((goal) => goal.subjectId === selectedSubject.id)
              .map((goal) => {
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
    </main>
  );
}

export default LearnView;
