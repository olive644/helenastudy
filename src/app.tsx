import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Home,
  Layers3,
  Library,
  Plus,
} from "lucide-react";
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
          <Home size={20} />
          Início
        </button>
        <button
          className={view === "builder" ? "nav-item nav-item--active" : "nav-item"}
          type="button"
          onClick={() => onNavigate("builder")}
        >
          <FileText size={20} />
          Planejar aula
        </button>
        <button className="nav-item" type="button" disabled>
          <Library size={20} />
          Biblioteca
          <span className="soon-badge">Em breve</span>
        </button>
      </nav>
      <div className="sidebar__footer">
        <span>Produto da marca</span>
        <strong>Oli</strong>
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
        <Home size={21} />
        <span>Início</span>
      </button>
      <button
        className={
          view === "builder" ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"
        }
        type="button"
        onClick={() => onNavigate("builder")}
      >
        <Plus size={22} />
        <span>Nova aula</span>
      </button>
      <button className="mobile-nav__item" type="button" disabled>
        <Library size={21} />
        <span>Biblioteca</span>
      </button>
    </nav>
  );
}

function HomeView({ onCreate }: { onCreate: () => void }) {
  return (
    <main className="main-content" id="main-content">
      <header className="topbar">
        <div className="topbar__mobile-brand">
          <HelenaBrand />
        </div>
        <span className="local-badge">Primeira versão · modo local</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__content">
          <span className="eyebrow">Planejamento de aulas de inglês</span>
          <h1 id="hero-title">Sua próxima aula começa com uma boa estrutura.</h1>
          <p>
            Informe o tema, a turma e o tempo disponível. A Helena organiza um ponto de partida para
            você revisar e adaptar.
          </p>
          <button className="primary-button" type="button" onClick={onCreate}>
            <Plus size={20} />
            Criar primeira aula
          </button>
          <small>Sem cadastro e sem envio de dados nesta fase.</small>
        </div>
        <div className="hero__mascot" aria-hidden="true">
          <div className="mascot-card">
            <img src="/helena-mark.svg" alt="" width="176" height="176" />
            <span className="mascot-card__bubble">Vamos organizar?</span>
          </div>
        </div>
      </section>

      <section className="foundation" aria-labelledby="foundation-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Como funciona</span>
            <h2 id="foundation-title">Da ideia ao plano em três passos</h2>
          </div>
        </div>
        <div className="step-grid">
          <article className="step-card">
            <div className="step-card__icon step-card__icon--yellow">
              <BookOpen size={23} />
            </div>
            <span>01</span>
            <h3>Defina o conteúdo</h3>
            <p>Tema, nível CEFR, perfil da turma e objetivo principal.</p>
          </article>
          <article className="step-card">
            <div className="step-card__icon step-card__icon--violet">
              <Layers3 size={23} />
            </div>
            <span>02</span>
            <h3>Monte a estrutura</h3>
            <p>Warm-up, apresentação, prática, produção e homework.</p>
          </article>
          <article className="step-card">
            <div className="step-card__icon step-card__icon--dark">
              <CheckCircle2 size={23} />
            </div>
            <span>03</span>
            <h3>Revise com liberdade</h3>
            <p>O professor mantém o controle sobre cada decisão pedagógica.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

function DraftPreview({ draft }: { draft: LessonDraft | null }) {
  if (!draft) {
    return (
      <aside className="preview-card preview-card--empty" aria-live="polite">
        <div className="preview-card__empty-icon">
          <GraduationCap size={28} />
        </div>
        <h2>Sua estrutura aparecerá aqui</h2>
        <p>Preencha os dados essenciais e clique em “Montar estrutura”.</p>
        <ul>
          <li>Objetivo da aula</li>
          <li>Distribuição do tempo</li>
          <li>Cinco etapas pedagógicas</li>
        </ul>
      </aside>
    );
  }

  return (
    <aside className="preview-card" aria-live="polite" aria-labelledby="draft-title">
      <div className="preview-card__header">
        <span>Rascunho local</span>
        <div className="draft-meta">
          <span>{draft.level}</span>
          <span>
            <Clock3 size={14} /> {draft.duration} min
          </span>
        </div>
      </div>
      <h2 id="draft-title">{draft.title}</h2>
      <p className="draft-audience">{draft.audience}</p>
      <div className="objective-box">
        <span>Objetivo</span>
        <p>{draft.objective}</p>
      </div>
      <ol className="timeline">
        {draft.sections.map((section) => (
          <li key={section.kind}>
            <div className="timeline__marker" />
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
      <div className="preview-note">
        Esta é uma estrutura determinística. A edição detalhada e a geração por IA entrarão em
        etapas futuras.
      </div>
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
      <header className="builder__header">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
          aria-label="Voltar ao início"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="eyebrow">Novo planejamento</span>
          <h1>Comece pelo essencial</h1>
          <p>Esses dados serão usados somente no seu navegador nesta versão.</p>
        </div>
      </header>

      <div className="builder-grid">
        <form className="lesson-form" onSubmit={submit}>
          <div className="form-section-heading">
            <span>1</span>
            <div>
              <h2>Contexto da aula</h2>
              <p>O mínimo necessário para montar uma primeira estrutura.</p>
            </div>
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
            <legend>Abordagem de apresentação</legend>
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
            <Layers3 size={20} />
            Montar estrutura
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
