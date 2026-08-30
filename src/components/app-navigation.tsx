import { HelenaBrand } from "./helena-brand";

export type AppView =
  "today" | "planner" | "focus" | "habits" | "notes" | "lesson-builder" | "learn" | "library";

type NavigationProps = {
  view: AppView;
  onNavigate: (view: AppView) => void;
};

const PRIMARY_ITEMS = [
  { view: "today", label: "Hoje", symbol: "H" },
  { view: "planner", label: "Agenda", symbol: "A" },
  { view: "focus", label: "Foco", symbol: "F" },
  { view: "habits", label: "Hábitos", symbol: "✓" },
  { view: "notes", label: "Cadernos", symbol: "C" },
] as const;

export function Sidebar({ view, onNavigate }: NavigationProps) {
  return (
    <aside className="sidebar">
      <HelenaBrand />
      <nav className="sidebar__nav" aria-label="Navegação principal">
        {PRIMARY_ITEMS.map((item) => {
          return (
            <button
              className={view === item.view ? "nav-item nav-item--active" : "nav-item"}
              type="button"
              onClick={() => onNavigate(item.view)}
              key={item.view}
            >
              <span className="nav-symbol" aria-hidden="true">
                {item.symbol}
              </span>
              {item.label}
            </button>
          );
        })}
        <span className="nav-divider" />
        <button
          className={view === "lesson-builder" ? "nav-item nav-item--active" : "nav-item"}
          type="button"
          onClick={() => onNavigate("lesson-builder")}
        >
          <span className="nav-symbol" aria-hidden="true">
            P
          </span>
          Planos de aula
        </button>
        <button
          className={view === "learn" ? "nav-item nav-item--active" : "nav-item"}
          type="button"
          onClick={() => onNavigate("learn")}
        >
          <span className="nav-symbol" aria-hidden="true">
            A
          </span>
          Aprender
        </button>
        <button
          className={view === "library" ? "nav-item nav-item--active" : "nav-item"}
          type="button"
          onClick={() => onNavigate("library")}
        >
          <span className="nav-symbol" aria-hidden="true">
            B
          </span>
          Biblioteca
        </button>
      </nav>
      <div className="sidebar__footer">
        <span>HelenaStudy</span>
        <small>um produto Oli</small>
      </div>
    </aside>
  );
}

export function MobileNavigation({ view, onNavigate }: NavigationProps) {
  return (
    <nav className="mobile-nav" aria-label="Navegação móvel">
      {PRIMARY_ITEMS.map((item) => {
        return (
          <button
            className={
              view === item.view ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"
            }
            type="button"
            onClick={() => onNavigate(item.view)}
            key={item.view}
          >
            <span className="mobile-nav-symbol" aria-hidden="true">
              {item.symbol}
            </span>
            <span>{item.label === "Cadernos" ? "Notas" : item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function PageHeader() {
  return (
    <header className="page-header">
      <div className="page-header__brand">
        <HelenaBrand />
      </div>
      <span className="local-note">Salvo somente neste dispositivo</span>
    </header>
  );
}
