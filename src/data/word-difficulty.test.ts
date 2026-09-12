import { beforeEach, describe, expect, it, vi } from "vitest";
import { classifyWordDifficulty, difficultyFromZipf } from "./word-difficulty";

describe("dificuldade de vocabulário", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("converte frequência Zipf em níveis claros", () => {
    expect(difficultyFromZipf(5)).toBe("easy");
    expect(difficultyFromZipf(4.5)).toBe("medium");
    expect(difficultyFromZipf(3.9)).toBe("hard");
  });

  it("consulta Datamuse e mantém o resultado em cache", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("{}", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ word: "school", tags: ["n", "f:120.5"] }]), {
          status: 200,
        }),
      );
    const result = await classifyWordDifficulty("School");
    expect(result.source).toBe("datamuse");
    expect(result.difficulty).toBe("easy");
    expect(window.localStorage.getItem("helena-study:word-frequency:v1")).toContain("school");
  });
});
