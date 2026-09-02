import { useEffect, useRef, useState } from "react";
import { HelenaBrand } from "./helena-brand";
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
  | "homework"
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
      { view: "homework", label: "Homework", icon: "homework" },
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
      aria-current={active ? "page" : undefined}
    >
      <NavigationIcon name={item.icon} />
      <span>{item.label}</span>
    </button>
  );
}

export function Sidebar({ view, onNavigate }: NavigationProps) {
  return (
    <aside className="sidebar">
      <HelenaBrand />
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
      <div className="sidebar__footer">
        <span className="status-dot" aria-hidden="true" />
        <div>
          <strong>Dados locais</strong>
          <small>Salvos neste dispositivo</small>
        </div>
      </div>
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
      <div className="page-header__brand">
        <HelenaBrand />
      </div>
      <span className="local-note">
        <i aria-hidden="true" /> Dados salvos neste dispositivo
      </span>
    </header>
  );
}
