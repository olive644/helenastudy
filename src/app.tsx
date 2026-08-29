import { useState } from "react";
import { MobileNavigation, Sidebar, type AppView } from "./components/app-navigation";
import { useWorkspace } from "./hooks/use-workspace";
import { FocusView } from "./views/focus-view";
import { HabitsView } from "./views/habits-view";
import { LessonBuilderView } from "./views/lesson-builder-view";
import { NotesView } from "./views/notes-view";
import { PlannerView } from "./views/planner-view";
import { TodayView } from "./views/today-view";

export function App() {
  const [view, setView] = useState<AppView>("today");
  const { workspace, dispatch } = useWorkspace();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      <Sidebar view={view} onNavigate={setView} />
      {view === "today" && (
        <TodayView workspace={workspace} dispatch={dispatch} onNavigate={setView} />
      )}
      {view === "planner" && <PlannerView workspace={workspace} dispatch={dispatch} />}
      {view === "focus" && <FocusView workspace={workspace} dispatch={dispatch} />}
      {view === "habits" && <HabitsView workspace={workspace} dispatch={dispatch} />}
      {view === "notes" && <NotesView workspace={workspace} dispatch={dispatch} />}
      {view === "lesson-builder" && <LessonBuilderView onBack={() => setView("today")} />}
      <MobileNavigation view={view} onNavigate={setView} />
    </div>
  );
}
