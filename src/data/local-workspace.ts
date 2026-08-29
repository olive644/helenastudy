import {
  WORKSPACE_VERSION,
  createInitialWorkspace,
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

export function isWorkspaceState(value: unknown): value is WorkspaceState {
  if (!isRecord(value) || value["version"] !== WORKSPACE_VERSION) return false;

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

export function loadWorkspace(storage: Pick<Storage, "getItem">): WorkspaceState {
  const serialized = storage.getItem(WORKSPACE_STORAGE_KEY);
  if (!serialized) return createInitialWorkspace();

  try {
    const parsed: unknown = JSON.parse(serialized);
    return isWorkspaceState(parsed) ? parsed : createInitialWorkspace();
  } catch {
    return createInitialWorkspace();
  }
}

export function saveWorkspace(storage: Pick<Storage, "setItem">, workspace: WorkspaceState): void {
  storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
}
