import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTheme } from "../hooks/use-theme";
import { writeSyncedStorage } from "../data/synced-storage";
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

type StoredProfile = { name?: string; photoUrl?: string };

const PROFILE_AVATARS = [
  { name: "Poliana", photoUrl: "/profile-avatars/poliana.webp" },
  { name: "Oliver", photoUrl: "/profile-avatars/oliver.webp" },
  { name: "Andreyna", photoUrl: "/profile-avatars/andreyna.webp" },
  { name: "Jairo", photoUrl: "/profile-avatars/jairo.webp" },
  { name: "Helena", photoUrl: "/profile-avatars/helena.webp" },
] as const;

function readStoredProfile(): StoredProfile {
  try {
    return JSON.parse(localStorage.getItem("helena.profile.v1") ?? "{}") as StoredProfile;
  } catch {
    return {};
  }
}

const NAVIGATION_SECTIONS: readonly { label: string; items: readonly NavigationItem[] }[] = [
  {
    label: "Área do aluno",
    items: [
      { view: "today", label: "Espaço do aluno", mobileLabel: "Espaço", icon: "today" },
      { view: "planner", label: "Agenda", icon: "planner" },
      { view: "focus", label: "Foco", icon: "focus" },
      { view: "learn", label: "Praticar", mobileLabel: "Praticar", icon: "learn" },
    ],
  },
  {
    label: "Meus materiais",
    items: [
      { view: "library", label: "Biblioteca", icon: "library" },
      { view: "notes", label: "Cadernos", mobileLabel: "Notas", icon: "notes" },
      { view: "habits", label: "Hábitos", icon: "habits" },
    ],
  },
  {
    label: "Área do professor",
    items: [
      { view: "lesson-builder", label: "Planos de aula", icon: "lesson" },
      { view: "activity-bank", label: "Banco de atividades", icon: "activity-bank" },
    ],
  },
];

const MOBILE_ITEMS: readonly NavigationItem[] = [
  { view: "today", label: "Espaço do aluno", mobileLabel: "Espaço", icon: "today" },
  { view: "planner", label: "Agenda", icon: "planner" },
  { view: "focus", label: "Foco", icon: "focus" },
  { view: "learn", label: "Praticar", mobileLabel: "Praticar", icon: "learn" },
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
          <div className="sidebar__brand" aria-label="OliStudy">
            <strong>
              Oli<span>Study</span>
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
  const [profile, setProfile] = useState(readStoredProfile);
  const [dragX, setDragX] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dragStartX = useRef<number | null>(null);
  const openDragStartX = useRef<number | null>(null);
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

  function chooseProfile(nextProfile: StoredProfile) {
    setProfile(nextProfile);
    writeSyncedStorage("helena.profile.v1", JSON.stringify(nextProfile));
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button, summary")) return;
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function drag(event: ReactPointerEvent<HTMLElement>) {
    if (dragStartX.current === null) return;
    setDragX(Math.min(0, event.clientX - dragStartX.current));
  }

  function finishDrag() {
    dragStartX.current = null;
    if (dragX < -80) setMoreOpen(false);
    setDragX(0);
  }

  function startOpenDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    openDragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function openDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (openDragStartX.current === null) return;
    if (event.clientX - openDragStartX.current > 48) {
      openDragStartX.current = null;
      setMoreOpen(true);
    }
  }

  function finishOpenDrag() {
    openDragStartX.current = null;
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
            className={dragX === 0 ? "mobile-more-sheet" : "mobile-more-sheet is-dragging"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            style={{ transform: `translateX(${dragX}px)` }}
            onPointerDown={startDrag}
            onPointerMove={drag}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
          >
            <header>
              <div>
                <span>
                  Oli<span>Study</span>
                </span>
                <h2 id="mobile-more-title">Mais ferramentas</h2>
              </div>
              <details className="mobile-drawer-profile">
                <summary className="user-profile" aria-label="Trocar foto de perfil">
                  <img
                    src={profile.photoUrl ?? "/profile-avatars/helena.webp"}
                    alt=""
                    width="54"
                    height="54"
                  />
                </summary>
                <section className="profile-picker">
                  <strong>Quem está estudando?</strong>
                  <div className="profile-picker__options">
                    {PROFILE_AVATARS.map((avatar) => (
                      <button
                        type="button"
                        onClick={(event) => {
                          chooseProfile(avatar);
                          event.currentTarget.closest("details")?.removeAttribute("open");
                        }}
                        key={avatar.name}
                      >
                        <img src={avatar.photoUrl} alt="" width="64" height="64" />
                        <span>{avatar.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </details>
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
            <button
              ref={closeButtonRef}
              className="mobile-more-edge-close"
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMoreOpen(false)}
            >
              <span aria-hidden="true">‹</span>
            </button>
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
      </nav>
      <button
        className={
          moreOpen || moreActive
            ? "mobile-nav__item mobile-more-trigger mobile-nav__item--active"
            : "mobile-nav__item mobile-more-trigger"
        }
        type="button"
        aria-label="Mais"
        aria-expanded={moreOpen}
        aria-controls="mobile-more-panel"
        onClick={() => setMoreOpen((open) => !open)}
      >
        <img
          className="mobile-more-avatar"
          src={profile.photoUrl ?? "/profile-avatars/helena.webp"}
          alt=""
          width="48"
          height="48"
        />
      </button>
      {!moreOpen && (
        <button
          className="mobile-more-edge-open"
          type="button"
          aria-label="Arraste para abrir as ferramentas"
          onClick={() => setMoreOpen(true)}
          onPointerDown={startOpenDrag}
          onPointerMove={openDrag}
          onPointerUp={finishOpenDrag}
          onPointerCancel={finishOpenDrag}
        ></button>
      )}
    </>
  );
}

export function PageHeader() {
  const [profile, setProfile] = useState(readStoredProfile);

  function chooseProfile(nextProfile: StoredProfile) {
    setProfile(nextProfile);
    try {
      writeSyncedStorage("helena.profile.v1", JSON.stringify(nextProfile));
    } catch {
      /* A escolha continua visível quando o armazenamento não está disponível. */
    }
  }

  return (
    <header className="page-header">
      <div className="page-header__mobile-brand" aria-label="OliStudy">
        <strong>
          Oli<span>Study</span>
        </strong>
      </div>
      <div className="page-header__actions">
        <div className="page-header__theme">
          <ThemeToggle />
        </div>
        <details className="profile-menu">
          <summary
            className="user-profile"
            aria-label={profile.name ? `Perfil de ${profile.name}` : "Escolher perfil"}
          >
            <img
              src={profile.photoUrl ?? "/profile-avatars/helena.webp"}
              alt=""
              width="44"
              height="44"
            />
          </summary>
          <section className="profile-picker">
            <div className="profile-picker__heading">
              <strong>Quem está estudando?</strong>
            </div>
            <div className="profile-picker__options">
              {PROFILE_AVATARS.map((avatar) => (
                <button
                  type="button"
                  onClick={(event) => {
                    chooseProfile(avatar);
                    event.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                  key={avatar.name}
                >
                  <img src={avatar.photoUrl} alt="" width="72" height="72" />
                  <span>{avatar.name}</span>
                </button>
              ))}
            </div>
          </section>
        </details>
      </div>
    </header>
  );
}
