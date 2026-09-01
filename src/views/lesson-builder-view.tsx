import { useState, type FormEvent } from "react";
import { PageHeader } from "../components/app-navigation";
import { createLessonDraft } from "../domain/create-lesson-draft";
import {
  CEFR_LEVELS,
  METHODOLOGIES,
  METHODOLOGY_LABELS,
  type LessonDraft,
  type LessonInput,
} from "../domain/lesson";

const INITIAL_INPUT: LessonInput = {
  topic: "",
  level: "A2",
  duration: 60,
  audience: "",
  aim: "",
  objective: "",
  methodology: "inductive",
};

function DraftPreview({ draft }: { draft: LessonDraft | null }) {
  if (!draft) {
    return (
      <aside className="preview preview--empty" aria-live="polite">
        <span className="preview-empty-mark" aria-hidden="true">
          A
        </span>
        <h2>Rascunho da aula</h2>
        <p>Preencha os campos ao lado para visualizar a distribuição do tempo e das atividades.</p>
      </aside>
    );
  }

  return (
    <aside className="preview" aria-live="polite" aria-labelledby="draft-title">
      <div className="preview__topline">
        <span>Rascunho</span>
        <div className="draft-meta">
          <span>{draft.level}</span>
          <span>{draft.duration} min</span>
        </div>
      </div>
      <h2 id="draft-title">{draft.title}</h2>
      <p className="draft-audience">{draft.audience}</p>
      <div className="objective">
        <span>Aim</span>
        <p>{draft.aim}</p>
      </div>
      <div className="objective">
        <span>Objective</span>
        <p>{draft.objective}</p>
      </div>
      <ol className="timeline">
        {draft.sections.map((section, index) => (
          <li key={section.kind}>
            <span className="timeline__number">{String(index + 1).padStart(2, "0")}</span>
            <div className="timeline__content">
              <div>
                <strong>{section.title}</strong>
                <span>{section.minutes} min</span>
              </div>
              <p>{section.guidance}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="preview__footnote">
        Estrutura criada localmente. Você poderá editar cada etapa em uma próxima versão.
      </p>
    </aside>
  );
}

export function LessonBuilderView({ onBack }: { onBack: () => void }) {
  const [input, setInput] = useState<LessonInput>(INITIAL_INPUT);
  const [draft, setDraft] = useState<LessonDraft | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraft(createLessonDraft(input));
  }

  return (
    <main className="main-content builder" id="main-content">
      <PageHeader />
      <header className="builder__header">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
          aria-label="Voltar para Hoje"
        >
          <span aria-hidden="true">←</span>
        </button>
        <div>
          <span className="section-label">Planejamento</span>
          <h1>Novo plano de aula</h1>
          <p>Preencha apenas o que fizer sentido para sua turma.</p>
        </div>
      </header>

      <div className="builder-grid">
        <form className="lesson-form" onSubmit={submit}>
          <div className="form-heading">
            <h2>Informações da aula</h2>
            <span>* campo obrigatório</span>
          </div>
          <label className="field field--full">
            <span>Tema da aula *</span>
            <input
              name="topic"
              value={input.topic}
              onChange={(event) => setInput({ ...input, topic: event.target.value })}
              placeholder="Ex.: Simple Past"
              required
              autoComplete="off"
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Nível CEFR</span>
              <select
                name="level"
                value={input.level}
                onChange={(event) =>
                  setInput({ ...input, level: event.target.value as LessonInput["level"] })
                }
              >
                {CEFR_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Duração</span>
              <select
                name="duration"
                value={input.duration}
                onChange={(event) => setInput({ ...input, duration: Number(event.target.value) })}
              >
                {[30, 45, 60, 90, 120].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutos
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field field--full">
            <span>Perfil da turma</span>
            <input
              name="audience"
              value={input.audience}
              onChange={(event) => setInput({ ...input, audience: event.target.value })}
              placeholder="Ex.: Adultos iniciantes"
              autoComplete="off"
            />
          </label>
          <label className="field field--full">
            <span>Aim</span>
            <small className="field-help">O que a aula representa: a intenção pedagógica.</small>
            <textarea
              name="aim"
              value={input.aim}
              onChange={(event) => setInput({ ...input, aim: event.target.value })}
              placeholder="Ex.: Ensinar o Simple Past para narrativas curtas"
              rows={2}
            />
          </label>
          <label className="field field--full">
            <span>Objective</span>
            <small className="field-help">
              O que o aluno consegue fazer na prática, ao final da aula.
            </small>
            <textarea
              name="objective"
              value={input.objective}
              onChange={(event) => setInput({ ...input, objective: event.target.value })}
              placeholder="Ex.: Relatar o que fez no fim de semana"
              rows={3}
            />
          </label>
          <fieldset className="method-fieldset">
            <legend>Como apresentar o conteúdo</legend>
            <div className="method-grid">
              {METHODOLOGIES.map((methodology) => (
                <label className="method-option" key={methodology}>
                  <input
                    type="radio"
                    name="methodology"
                    value={methodology}
                    checked={input.methodology === methodology}
                    onChange={() => setInput({ ...input, methodology })}
                  />
                  <span>{METHODOLOGY_LABELS[methodology]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button className="primary-button primary-button--wide" type="submit">
            Criar rascunho
          </button>
        </form>
        <DraftPreview draft={draft} />
      </div>
    </main>
  );
}

export default LessonBuilderView;
