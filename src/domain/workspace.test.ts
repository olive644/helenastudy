import { describe, expect, it } from "vitest";
import { createInitialWorkspace, minutesFocusedOn, workspaceReducer } from "./workspace";

describe("workspaceReducer", () => {
  it("conecta tarefas e sessões de foco ao espaço de estudos", () => {
    const initial = createInitialWorkspace();
    const withTask = workspaceReducer(initial, {
      type: "task/added",
      title: "Estudar verbos",
      subjectId: "subject-english",
      dueDate: "2026-08-29",
    });
    const task = withTask.tasks[0];
    expect(task?.title).toBe("Estudar verbos");

    const completed = task
      ? workspaceReducer(withTask, { type: "task/toggled", id: task.id })
      : withTask;
    expect(completed.tasks[0]?.completed).toBe(true);

    const focused = workspaceReducer(completed, {
      type: "focus/recorded",
      subjectId: "subject-english",
      durationMinutes: 25,
      completedAt: "2026-08-29T18:00:00.000Z",
    });
    expect(minutesFocusedOn(focused, "2026-08-29")).toBe(25);
  });

  it("marca e desmarca o mesmo hábito no dia", () => {
    const withHabit = workspaceReducer(createInitialWorkspace(), {
      type: "habit/added",
      title: "Revisar flashcards",
    });
    const habit = withHabit.habits[0];
    expect(habit).toBeDefined();
    if (!habit) return;

    const checked = workspaceReducer(withHabit, {
      type: "habit/toggled",
      id: habit.id,
      date: "2026-08-29",
    });
    expect(checked.habits[0]?.completedDates).toEqual(["2026-08-29"]);

    const unchecked = workspaceReducer(checked, {
      type: "habit/toggled",
      id: habit.id,
      date: "2026-08-29",
    });
    expect(unchecked.habits[0]?.completedDates).toEqual([]);
  });
});
