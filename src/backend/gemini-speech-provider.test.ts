import { describe, expect, it } from "vitest";
import { pcmToWave } from "./gemini-speech-provider";

describe("áudio Gemini", () => {
  it("encapsula o PCM do Gemini em WAV reproduzível pelo navegador", () => {
    const wave = pcmToWave(new Uint8Array([1, 2, 3, 4]));
    const view = new DataView(wave.buffer);

    expect(new TextDecoder().decode(wave.slice(0, 4))).toBe("RIFF");
    expect(new TextDecoder().decode(wave.slice(8, 12))).toBe("WAVE");
    expect(view.getUint32(24, true)).toBe(24_000);
    expect(view.getUint32(40, true)).toBe(4);
    expect([...wave.slice(44)]).toEqual([1, 2, 3, 4]);
  });
});
