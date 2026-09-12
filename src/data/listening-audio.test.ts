import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NaturalVoicePlayer, type NaturalVoiceState } from "./listening-audio";

function jsonResponse(status: number, headers: Record<string, string> = {}) {
  return new Response(new Blob(["audio"]), { status, headers });
}

beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:fake"),
    revokeObjectURL: vi.fn(),
  });
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function collectStates(): { states: NaturalVoiceState[]; player: NaturalVoicePlayer } {
  const states: NaturalVoiceState[] = [];
  const player = new NaturalVoicePlayer((state) => states.push(state));
  return { states, player };
}

describe("NaturalVoicePlayer", () => {
  it("reproduz o audio quando o servico responde com sucesso", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { "X-TTS-Provider": "kokoro" })),
    );
    const { states, player } = collectStates();

    await player.generate("hello", 0.86);

    expect(states.map((s) => s.status)).toEqual(["generating", "playing"]);
  });

  it("avisa quando o audio veio de uma voz alternativa (Piper)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { "X-TTS-Provider": "piper" })),
    );
    const { states, player } = collectStates();

    await player.generate("hello", 0.86);

    expect(states.some((s) => s.message === "Usando voz alternativa.")).toBe(true);
  });

  it("chama o fallback e avisa sobre a voz do dispositivo quando o servico falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(503)));
    const { states, player } = collectStates();
    const fallback = vi.fn();

    await player.generate("hello", 0.86, fallback);

    expect(fallback).toHaveBeenCalledTimes(1);
    expect(states.at(-1)).toEqual({ status: "error", message: "Usando a voz do dispositivo." });
  });

  it("cancela a reproducao anterior quando generate e chamado de novo antes de terminar", async () => {
    let resolveFirst: (() => void) | undefined;
    const firstFetch = new Promise<Response>((resolve) => {
      resolveFirst = () => resolve(jsonResponse(200, { "X-TTS-Provider": "kokoro" }));
    });
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => firstFetch)
      .mockResolvedValueOnce(jsonResponse(200, { "X-TTS-Provider": "kokoro" }));
    vi.stubGlobal("fetch", fetchMock);
    const { states, player } = collectStates();

    const firstGenerate = player.generate("word one", 0.86);
    const secondGenerate = player.generate("word two", 0.86);
    resolveFirst?.();
    await Promise.all([firstGenerate, secondGenerate]);

    const playingCount = states.filter((s) => s.status === "playing").length;
    expect(playingCount).toBe(1);
  });
});
