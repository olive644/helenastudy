import { lazy, Suspense, useState } from "react";
import { MobileNavigation, Sidebar, type AppView } from "./components/app-navigation";
import { HelenaLoading } from "./components/helena-loading";
import { readLocalRoomCodeFromUrl } from "./domain/local-room";
import { useWorkspace } from "./hooks/use-workspace";
import { FocusView } from "./views/focus-view";
import { HabitsView } from "./views/habits-view";
import { PlannerView } from "./views/planner-view";
import { TodayView } from "./views/today-view";

const LearnView = lazy(() => import("./views/learn-view"));
const LibraryView = lazy(() => import("./views/library-view"));
const LessonBuilderView = lazy(() => import("./views/lesson-builder-view"));
const NotesView = lazy(() => import("./views/notes-view"));
const ActivityBankView = lazy(() => import("./views/activity-bank-view"));

export function App() {
  const [joinCode] = useState(() => readLocalRoomCodeFromUrl(window.location.href));
  const [view, setView] = useState<AppView>(joinCode ? "learn" : "today");
  const { workspace, dispatch } = useWorkspace();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      <Sidebar view={view} onNavigate={setView} />
      <Suspense
        fallback={
          <main className="main-content loading-view" id="main-content">
            <HelenaLoading label="Abrindo módulo…" />
          </main>
        }
      >
        {view === "today" && (
          <TodayView workspace={workspace} dispatch={dispatch} onNavigate={setView} />
        )}
        {view === "planner" && <PlannerView workspace={workspace} dispatch={dispatch} />}
        {view === "focus" && <FocusView workspace={workspace} dispatch={dispatch} />}
        {view === "habits" && <HabitsView workspace={workspace} dispatch={dispatch} />}
        {view === "notes" && <NotesView workspace={workspace} dispatch={dispatch} />}
        {view === "lesson-builder" && <LessonBuilderView onBack={() => setView("today")} />}
        {view === "learn" && (
          <LearnView workspace={workspace} dispatch={dispatch} joinCode={joinCode} />
        )}
        {view === "library" && <LibraryView workspace={workspace} dispatch={dispatch} />}
        {view === "activity-bank" && <ActivityBankView onBack={() => setView("today")} />}
      </Suspense>
      <MobileNavigation view={view} onNavigate={setView} />
    </div>
  );
}
