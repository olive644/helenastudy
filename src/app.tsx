import { useState, type FormEvent } from "react";
import { ArrowLeft, Clock3, FileText, GraduationCap, Home, Library, Plus } from "lucide-react";
import { HelenaBrand } from "./components/helena-brand";
import { createLessonDraft } from "./domain/create-lesson-draft";
import {
  CEFR_LEVELS,
  METHODOLOGIES,
  METHODOLOGY_LABELS,
  type LessonDraft,
  type LessonInput,
} from "./domain/lesson";

type View = "home" | "builder";

const INITIAL_INPUT: LessonInput = {
  topic: "",
  level: "A2",
  duration: 60,
  audience: "",
  objective: "",
  methodology: "inductive",
};

function Sidebar({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  return (
    <aside className="sidebar">
      <HelenaBrand />
      <nav className="sidebar__nav" aria-label="Navegação principal">
        <button
          className={view === "home" ? "nav-item nav-item--active" : "nav-item"}
          type="button"
          onClick={() => onNavigate("home")}
        >
          <Home size={19} />
          Início
        </button>
        <button
          className={view === "builder" ? "nav-item nav-item--active" : "nav-item"}
          type="button"
          onClick={() => onNavigate("builder")}
        >
          <FileText size={19} />
          Planos de aula
        </button>
        <button className="nav-item" type="button" disabled>
          <Library size={19} />
          Materiais
          <span className="soon-badge">Depois</span>
        </button>
      </nav>
      <div className="sidebar__footer">
        <span>HelenaStudy</span>
        <small>um produto Oli</small>
      </div>
    </aside>
  );
}

function MobileNavigation({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  return (
    <nav className="mobile-nav" aria-label="Navegação móvel">
      <button
        className={
          view === "home" ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"
        }
        type="button"
        onClick={() => onNavigate("home")}
      >
        <Home size={20} />
        <span>Início</span>
      </button>
      <button
        className={
          view === "builder" ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"
        }
        type="button"
        onClick={() => onNavigate("builder")}
      >
        <FileText size={20} />
        <span>Planos</span>
      </button>
      <button className="mobile-nav__item" type="button" disabled>
        <Library size={20} />
        <span>Materiais</span>
      </button>
    </nav>
  );
}

function PageHeader() {
  return (
    <header className="page-header">
      <div className="page-header__brand">
        <HelenaBrand />
      </div>
      <span className="local-note">Os dados ficam neste dispositivo</span>
    </header>
  );
}

function HomeView({ onCreate }: { onCreate: () => void }) {
  return (
    <main className="main-content" id="main-content">
      <PageHeader />

      <section className="welcome" aria-labelledby="welcome-title">
        <div className="welcome__copy">
          <span className="section-label">Início</span>
          <h1 id="welcome-title">O que você vai ensinar hoje?</h1>
          <p>Organize o conteúdo e monte um primeiro rascunho da aula.</p>
          <button className="primary-button" type="button" onClick={onCreate}>
            <Plus size={19} />
            Criar plano de aula
          </button>
        </div>
        <img
          className="welcome__helena"
          src="/helena.svg"
          alt="Helena, a gata preta de olhos amarelos"
          width="210"
          height="240"
        />
      </section>

      <div className="home-grid">
        <section className="plain-panel" aria-labelledby="start-title">
          <div className="panel-heading">
            <div>
              <span className="section-label">Primeiro passo</span>
              <h2 id="start-title">Comece com o básico</h2>
            </div>
            <span className="panel-number">01</span>
          </div>
          <p className="panel-intro">
            Tema, nível da turma e duração já são suficientes para criar uma estrutura inicial.
          </p>
          <dl className="definition-list">
            <div>
              <dt>Conteúdo</dt>
              <dd>O assunto principal da aula</dd>
            </div>
            <div>
              <dt>Turma</dt>
              <dd>Nível CEFR e perfil dos alunos</dd>
            </div>
            <div>
              <dt>Tempo</dt>
              <dd>De 30 a 120 minutos</dd>
            </div>
          </dl>
          <button className="text-button" type="button" onClick={onCreate}>
            Abrir planejamento <span aria-hidden="true">→</span>
          </button>
        </section>

        <section className="plain-panel" aria-labelledby="structure-title">
          <div className="panel-heading">
            <div>
              <span className="section-label">Estrutura sugerida</span>
              <h2 id="structure-title">Uma aula completa</h2>
            </div>
          </div>
          <ol className="lesson-outline">
            <li>
              <span>01</span>
              <div>
                <strong>Warm-up</strong>
                <small>Retomar conhecimentos da turma</small>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Apresentação</strong>
                <small>Introduzir o conteúdo em contexto</small>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Prática e produção</strong>
                <small>Usar o inglês com mais autonomia</small>
              </div>
            </li>
            <li>
              <span>04</span>
              <div>
                <strong>Homework</strong>
                <small>Continuar o aprendizado depois da aula</small>
              </div>
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}

function DraftPreview({ draft }: { draft: LessonDraft | null }) {
  if (!draft) {
    return (
      <aside className="preview preview--empty" aria-live="polite">
        <GraduationCap size={26} aria-hidden="true" />
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
          <span>
            <Clock3 size={14} /> {draft.duration} min
          </span>
        </div>
      </div>
      <h2 id="draft-title">{draft.title}</h2>
      <p className="draft-audience">{draft.audience}</p>
      <div className="objective">
        <span>Objetivo</span>
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
        Estrutura criada localmente. Você ainda poderá editar cada etapa em uma próxima versão.
      </p>
    </aside>
  );
}

function BuilderView({ onBack }: { onBack: () => void }) {
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
          aria-label="Voltar ao início"
        >
          <ArrowLeft size={19} />
        </button>
        <div>
          <span className="section-label">Planejamento</span>
          <h1>Novo plano de aula</h1>
          <p>Preencha apenas o que fizer sentido para a sua turma.</p>
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
            <span>Objetivo comunicativo</span>
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

export function App() {
  const [view, setView] = useState<View>("home");

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      <Sidebar view={view} onNavigate={setView} />
      {view === "home" ? (
        <HomeView onCreate={() => setView("builder")} />
      ) : (
        <BuilderView onBack={() => setView("home")} />
      )}
      <MobileNavigation view={view} onNavigate={setView} />
    </div>
  );
}
