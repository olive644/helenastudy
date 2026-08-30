import {
  WORKSPACE_VERSION,
  createInitialWorkspace,
  type FocusSession,
  type Habit,
  type StudyEvent,
  type StudyNote,
  type StudyTask,
  type Subject,
  type WorkspaceState,
} from "../domain/workspace";

export const WORKSPACE_STORAGE_KEY = "helenastudy.workspace.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isSubject(value: unknown): boolean {
  return (
    isRecord(value) && isString(value["id"]) && isString(value["name"]) && isString(value["color"])
  );
}

function isTask(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value["id"]) &&
    isString(value["title"]) &&
    isString(value["subjectId"]) &&
    isString(value["dueDate"]) &&
    typeof value["completed"] === "boolean"
  );
}

function isEvent(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value["id"]) &&
    isString(value["title"]) &&
    isString(value["subjectId"]) &&
    isString(value["date"]) &&
    isString(value["time"])
  );
}

function isHabit(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value["id"]) &&
    isString(value["title"]) &&
    Array.isArray(value["completedDates"]) &&
    value["completedDates"].every(isString)
  );
}

function isNote(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value["id"]) &&
    isString(value["title"]) &&
    isString(value["content"]) &&
    isString(value["subjectId"]) &&
    isString(value["updatedAt"])
  );
}

function isFocusSession(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value["id"]) &&
    isString(value["subjectId"]) &&
    typeof value["durationMinutes"] === "number" &&
    Number.isFinite(value["durationMinutes"]) &&
    value["durationMinutes"] > 0 &&
    isString(value["completedAt"])
  );
}

function isMaterial(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value["id"]) &&
    isString(value["subjectId"]) &&
    isString(value["title"]) &&
    (value["kind"] === "link" || value["kind"] === "text") &&
    isString(value["content"]) &&
    isString(value["createdAt"])
  );
}

function isFlashcard(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value["id"]) &&
    isString(value["subjectId"]) &&
    isString(value["front"]) &&
    isString(value["back"]) &&
    typeof value["intervalDays"] === "number" &&
    Number.isInteger(value["intervalDays"]) &&
    value["intervalDays"] >= 0 &&
    isString(value["nextReview"])
  );
}

function isGoal(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value["id"]) &&
    isString(value["subjectId"]) &&
    isString(value["title"]) &&
    typeof value["targetMinutes"] === "number" &&
    Number.isFinite(value["targetMinutes"]) &&
    value["targetMinutes"] > 0 &&
    isString(value["deadline"]) &&
    typeof value["completed"] === "boolean"
  );
}

function isQuizAttempt(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value["id"]) &&
    isString(value["subjectId"]) &&
    typeof value["correct"] === "number" &&
    Number.isInteger(value["correct"]) &&
    typeof value["total"] === "number" &&
    Number.isInteger(value["total"]) &&
    value["correct"] >= 0 &&
    value["total"] > 0 &&
    value["correct"] <= value["total"] &&
    isString(value["completedAt"])
  );
}

type LegacyWorkspace = {
  version: 1;
  subjects: Subject[];
  tasks: StudyTask[];
  events: StudyEvent[];
  habits: Habit[];
  notes: StudyNote[];
  focusSessions: FocusSession[];
};

function hasCoreCollections(value: Record<string, unknown>): boolean {
  return (
    Array.isArray(value["subjects"]) &&
    value["subjects"].length > 0 &&
    value["subjects"].every(isSubject) &&
    Array.isArray(value["tasks"]) &&
    value["tasks"].every(isTask) &&
    Array.isArray(value["events"]) &&
    value["events"].every(isEvent) &&
    Array.isArray(value["habits"]) &&
    value["habits"].every(isHabit) &&
    Array.isArray(value["notes"]) &&
    value["notes"].every(isNote) &&
    Array.isArray(value["focusSessions"]) &&
    value["focusSessions"].every(isFocusSession)
  );
}

function isLegacyWorkspace(value: unknown): value is LegacyWorkspace {
  return isRecord(value) && value["version"] === 1 && hasCoreCollections(value);
}

export function isWorkspaceState(value: unknown): value is WorkspaceState {
  if (!isRecord(value) || value["version"] !== WORKSPACE_VERSION) return false;

  return (
    hasCoreCollections(value) &&
    Array.isArray(value["materials"]) &&
    value["materials"].every(isMaterial) &&
    Array.isArray(value["flashcards"]) &&
    value["flashcards"].every(isFlashcard) &&
    Array.isArray(value["goals"]) &&
    value["goals"].every(isGoal) &&
    Array.isArray(value["quizAttempts"]) &&
    value["quizAttempts"].every(isQuizAttempt)
  );
}

function migrateLegacyWorkspace(legacy: LegacyWorkspace): WorkspaceState {
  return {
    ...legacy,
    version: WORKSPACE_VERSION,
    materials: [],
    flashcards: [],
    goals: [],
    quizAttempts: [],
  };
}

export function loadWorkspace(storage: Pick<Storage, "getItem">): WorkspaceState {
  const serialized = storage.getItem(WORKSPACE_STORAGE_KEY);
  if (!serialized) return createInitialWorkspace();

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (isWorkspaceState(parsed)) return parsed;
    if (isLegacyWorkspace(parsed)) return migrateLegacyWorkspace(parsed);
    return createInitialWorkspace();
  } catch {
    return createInitialWorkspace();
  }
}

export function saveWorkspace(storage: Pick<Storage, "setItem">, workspace: WorkspaceState): void {
  storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
}
