import { useEffect, useRef, useState } from "react";
import { useTheme } from "../hooks/use-theme";
import { NavigationIcon, type NavigationIconName } from "./navigation-icon";

export type AppView =
  | "today"
  | "planner"
  | "focus"
  | "habits"
  | "notes"
  | "lesson-builder"
  | "learn"
  | "library"
  | "activity-bank";

type NavigationProps = {
  view: AppView;
  onNavigate: (view: AppView) => void;
};

type NavigationItem = {
  view: AppView;
  label: string;
  mobileLabel?: string;
  icon: NavigationIconName;
};

const NAVIGATION_SECTIONS: readonly { label: string; items: readonly NavigationItem[] }[] = [
  {
    label: "Principal",
    items: [
      { view: "today", label: "Espaço do aluno", mobileLabel: "Espaço", icon: "today" },
      { view: "planner", label: "Agenda", icon: "planner" },
    ],
  },
  {
    label: "Estudar",
    items: [
      { view: "focus", label: "Foco", icon: "focus" },
      { view: "learn", label: "Quizzes e bingo", mobileLabel: "Praticar", icon: "learn" },
      { view: "library", label: "Biblioteca", icon: "library" },
    ],
  },
  {
    label: "Organizar",
    items: [
      { view: "habits", label: "Hábitos", icon: "habits" },
      { view: "notes", label: "Cadernos", mobileLabel: "Notas", icon: "notes" },
      { view: "lesson-builder", label: "Planos de aula", icon: "lesson" },
      { view: "activity-bank", label: "Banco de atividades", icon: "activity-bank" },
    ],
  },
];

const MOBILE_ITEMS: readonly NavigationItem[] = [
  { view: "today", label: "Espaço do aluno", mobileLabel: "Espaço", icon: "today" },
  { view: "planner", label: "Agenda", icon: "planner" },
  { view: "focus", label: "Foco", icon: "focus" },
  { view: "learn", label: "Quizzes e bingo", mobileLabel: "Praticar", icon: "learn" },
];

const MORE_ITEMS = NAVIGATION_SECTIONS.flatMap((section) => section.items).filter(
  (item) => !MOBILE_ITEMS.some((mobileItem) => mobileItem.view === item.view),
);

function NavigationButton({
  item,
  active,
  onSelect,
}: {
  item: NavigationItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={active ? "nav-item nav-item--active" : "nav-item"}
      type="button"
      onClick={onSelect}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
    >
      <NavigationIcon name={item.icon} />
      <span>{item.label}</span>
    </button>
  );
}

export function ThemeToggle({ showLabel }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Tema escuro" : "Tema claro";
  return (
    <button
      className="theme-toggle"
      type="button"
      data-theme={theme}
      onClick={toggleTheme}
      aria-label={`${label}. Toque para trocar de tema.`}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__celestial theme-toggle__moon">
          <NavigationIcon name="theme-dark" />
        </span>
        <span className="theme-toggle__celestial theme-toggle__sun">
          <NavigationIcon name="theme-light" />
        </span>
        <span className="theme-toggle__thumb" />
      </span>
      {showLabel && <span>{label}</span>}
    </button>
  );
}

export function Sidebar({ view, onNavigate }: NavigationProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside className={expanded ? "sidebar sidebar--expanded" : "sidebar"}>
      <div className="sidebar__top">
        <button
          className="sidebar__toggle"
          type="button"
          aria-label={expanded ? "Recolher menu lateral" : "Expandir menu lateral"}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        {expanded && (
          <div className="sidebar__brand" aria-label="HelenaStudy">
            <img src="/helena-portrait.png" alt="" width="36" height="36" />
            <strong>
              Helena<span>Study</span>
            </strong>
          </div>
        )}
      </div>
      <nav className="sidebar__nav" aria-label="Navegação principal">
        {NAVIGATION_SECTIONS.map((section) => (
          <section className="nav-section" aria-label={section.label} key={section.label}>
            <span className="nav-section__label">{section.label}</span>
            {section.items.map((item) => (
              <NavigationButton
                item={item}
                active={view === item.view}
                onSelect={() => onNavigate(item.view)}
                key={item.view}
              />
            ))}
          </section>
        ))}
      </nav>
    </aside>
  );
}

export function MobileNavigation({ view, onNavigate }: NavigationProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const moreActive = MORE_ITEMS.some((item) => item.view === view);

  useEffect(() => {
    if (!moreOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen]);

  function navigate(itemView: AppView) {
    onNavigate(itemView);
    setMoreOpen(false);
  }

  return (
    <>
      {moreOpen && (
        <div className="mobile-more-layer">
          <button
            className="mobile-more-backdrop"
            type="button"
            aria-label="Fechar mais opções"
            onClick={() => setMoreOpen(false)}
          />
          <section
            id="mobile-more-panel"
            className="mobile-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
          >
            <header>
              <div>
                <span>HelenaStudy</span>
                <h2 id="mobile-more-title">Mais ferramentas</h2>
              </div>
              <button
                ref={closeButtonRef}
                className="sheet-close"
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMoreOpen(false)}
              >
                <NavigationIcon name="close" />
              </button>
            </header>
            <div className="mobile-more-grid">
              {MORE_ITEMS.map((item) => (
                <button
                  className={view === item.view ? "more-item more-item--active" : "more-item"}
                  type="button"
                  onClick={() => navigate(item.view)}
                  aria-current={view === item.view ? "page" : undefined}
                  key={item.view}
                >
                  <NavigationIcon name={item.icon} />
                  <span>{item.mobileLabel ?? item.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      <nav className="mobile-nav" aria-label="Navegação móvel">
        {MOBILE_ITEMS.map((item) => {
          const active = view === item.view;
          return (
            <button
              className={active ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"}
              type="button"
              onClick={() => navigate(item.view)}
              aria-current={active ? "page" : undefined}
              key={item.view}
            >
              <span className="mobile-nav__icon">
                <NavigationIcon name={item.icon} />
              </span>
              <span>{item.mobileLabel ?? item.label}</span>
            </button>
          );
        })}
        <button
          className={
            moreOpen || moreActive
              ? "mobile-nav__item mobile-nav__item--active"
              : "mobile-nav__item"
          }
          type="button"
          aria-expanded={moreOpen}
          aria-controls="mobile-more-panel"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span className="mobile-nav__icon">
            <NavigationIcon name="more" />
          </span>
          <span>Mais</span>
        </button>
      </nav>
    </>
  );
}

export function PageHeader() {
  return (
    <header className="page-header">
      <div className="page-header__actions">
        <div className="page-header__theme">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
