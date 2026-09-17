import { describe, expect, it } from "vitest";
import { nextPomodoroStep } from "./focus-view";

describe("ciclo Pomodoro", () => {
  it("faz três pausas curtas e uma pausa longa a cada quatro focos", () => {
    expect(nextPomodoroStep("focus", 0)).toEqual({
      phase: "shortBreak",
      duration: 5,
      completed: 1,
    });
    expect(nextPomodoroStep("focus", 3)).toEqual({
      phase: "longBreak",
      duration: 15,
      completed: 4,
    });
    expect(nextPomodoroStep("longBreak", 4)).toEqual({
      phase: "focus",
      duration: 25,
      completed: 4,
    });
  });
});
