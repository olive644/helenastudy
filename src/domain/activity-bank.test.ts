import { describe, expect, it } from "vitest";
import {
  ACTIVITY_LIBRARY,
  findActivity,
  listActivitiesByControlLevel,
} from "./activity-bank";

describe("activity-bank", () => {
  it("tem as 13 atividades das notas, todas com classificação completa", () => {
    expect(ACTIVITY_LIBRARY).toHaveLength(13);
    for (const activity of ACTIVITY_LIBRARY) {
      expect(activity.time).toBeGreaterThan(0);
      expect(activity.topic).not.toBe("");
      expect(activity.steps.length).toBeGreaterThan(0);
      expect(activity.goal).not.toBe("");
    }
  });

  it("não repete id entre atividades", () => {
    const ids = ACTIVITY_LIBRARY.map((activity) => activity.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("separa atividades por nível de controle", () => {
    const totalControlled = listActivitiesByControlLevel("total-controlled");
    const semiControlled = listActivitiesByControlLevel("semi-controlled");

    expect(totalControlled).toHaveLength(8);
    expect(semiControlled).toHaveLength(5);
    expect(totalControlled.every((activity) => activity.controlLevel === "total-controlled")).toBe(
      true,
    );
    expect(semiControlled.every((activity) => activity.controlLevel === "semi-controlled")).toBe(
      true,
    );
  });

  it("encontra uma atividade pelo id", () => {
    expect(findActivity("bingo")?.name).toBe("Bingo");
    expect(findActivity("inexistente")).toBeUndefined();
  });
});
