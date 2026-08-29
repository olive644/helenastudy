import { BookOpen, CalendarDays, CheckCircle2, Clock3, Home, NotebookPen } from "lucide-react";
import { HelenaBrand } from "./helena-brand";

export type AppView = "today" | "planner" | "focus" | "habits" | "notes" | "lesson-builder";

type NavigationProps = {
  view: AppView;
  onNavigate: (view: AppView) => void;
};

const PRIMARY_ITEMS = [
  { view: "today", label: "Hoje", icon: Home },
  { view: "planner", label: "Agenda", icon: CalendarDays },
  { view: "focus", label: "Foco", icon: Clock3 },
  { view: "habits", label: "Hábitos", icon: CheckCircle2 },
  { view: "notes", label: "Cadernos", icon: NotebookPen },
] as const;

export function Sidebar({ view, onNavigate }: NavigationProps) {
  return (
    <aside className="sidebar">
      <HelenaBrand />
      <nav className="sidebar__nav" aria-label="Navegação principal">
        {PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={view === item.view ? "nav-item nav-item--active" : "nav-item"}
              type="button"
              onClick={() => onNavigate(item.view)}
              key={item.view}
            >
              <Icon size={18} />
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
          <BookOpen size={18} />
          Planos de aula
        </button>
        <button className="nav-item" type="button" disabled>
          <span className="nav-symbol">A</span>
          Aprender
          <span className="soon-badge">Depois</span>
        </button>
        <button className="nav-item" type="button" disabled>
          <span className="nav-symbol">B</span>
          Biblioteca
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

export function MobileNavigation({ view, onNavigate }: NavigationProps) {
  return (
    <nav className="mobile-nav" aria-label="Navegação móvel">
      {PRIMARY_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            className={
              view === item.view ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"
            }
            type="button"
            onClick={() => onNavigate(item.view)}
            key={item.view}
          >
            <Icon size={19} />
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
