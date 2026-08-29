export const WORKSPACE_VERSION = 1 as const;

export type Subject = {
  id: string;
  name: string;
  color: string;
};

export type StudyTask = {
  id: string;
  title: string;
  subjectId: string;
  dueDate: string;
  completed: boolean;
};

export type StudyEvent = {
  id: string;
  title: string;
  subjectId: string;
  date: string;
  time: string;
};

export type Habit = {
  id: string;
  title: string;
  completedDates: string[];
};

export type StudyNote = {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  updatedAt: string;
};

export type FocusSession = {
  id: string;
  subjectId: string;
  durationMinutes: number;
  completedAt: string;
};

export type WorkspaceState = {
  version: typeof WORKSPACE_VERSION;
  subjects: Subject[];
  tasks: StudyTask[];
  events: StudyEvent[];
  habits: Habit[];
  notes: StudyNote[];
  focusSessions: FocusSession[];
};

export type WorkspaceAction =
  | { type: "subject/added"; name: string; color: string }
  | { type: "task/added"; title: string; subjectId: string; dueDate: string }
  | { type: "task/toggled"; id: string }
  | { type: "event/added"; title: string; subjectId: string; date: string; time: string }
  | { type: "habit/added"; title: string }
  | { type: "habit/toggled"; id: string; date: string }
  | { type: "note/added"; subjectId: string; updatedAt: string }
  | { type: "note/updated"; id: string; title: string; content: string; updatedAt: string }
  | {
      type: "focus/recorded";
      subjectId: string;
      durationMinutes: number;
      completedAt: string;
    };

function createId(prefix: string): string {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `${prefix}-${suffix}`;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createInitialWorkspace(): WorkspaceState {
  return {
    version: WORKSPACE_VERSION,
    subjects: [{ id: "subject-english", name: "Inglês", color: "#7257e8" }],
    tasks: [],
    events: [],
    habits: [],
    notes: [],
    focusSessions: [],
  };
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "subject/added":
      return {
        ...state,
        subjects: [
          ...state.subjects,
          { id: createId("subject"), name: action.name, color: action.color },
        ],
      };
    case "task/added":
      return {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id: createId("task"),
            title: action.title,
            subjectId: action.subjectId,
            dueDate: action.dueDate,
            completed: false,
          },
        ],
      };
    case "task/toggled":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id ? { ...task, completed: !task.completed } : task,
        ),
      };
    case "event/added":
      return {
        ...state,
        events: [
          ...state.events,
          {
            id: createId("event"),
            title: action.title,
            subjectId: action.subjectId,
            date: action.date,
            time: action.time,
          },
        ],
      };
    case "habit/added":
      return {
        ...state,
        habits: [
          ...state.habits,
          { id: createId("habit"), title: action.title, completedDates: [] },
        ],
      };
    case "habit/toggled":
      return {
        ...state,
        habits: state.habits.map((habit) => {
          if (habit.id !== action.id) return habit;
          const completed = habit.completedDates.includes(action.date);
          return {
            ...habit,
            completedDates: completed
              ? habit.completedDates.filter((date) => date !== action.date)
              : [...habit.completedDates, action.date],
          };
        }),
      };
    case "note/added":
      return {
        ...state,
        notes: [
          {
            id: createId("note"),
            title: "Nova anotação",
            content: "",
            subjectId: action.subjectId,
            updatedAt: action.updatedAt,
          },
          ...state.notes,
        ],
      };
    case "note/updated":
      return {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.id
            ? {
                ...note,
                title: action.title,
                content: action.content,
                updatedAt: action.updatedAt,
              }
            : note,
        ),
      };
    case "focus/recorded":
      return {
        ...state,
        focusSessions: [
          ...state.focusSessions,
          {
            id: createId("focus"),
            subjectId: action.subjectId,
            durationMinutes: action.durationMinutes,
            completedAt: action.completedAt,
          },
        ],
      };
  }
}

export function minutesFocusedOn(state: WorkspaceState, dateKey: string): number {
  return state.focusSessions
    .filter((session) => toDateKey(new Date(session.completedAt)) === dateKey)
    .reduce((total, session) => total + session.durationMinutes, 0);
}
