import { describe, expect, it } from "vitest";
import { findFemaleEnglishVoice, isEnglishVoice, voiceQualityScore } from "./speech-voice";

describe("seleção de voz inglesa", () => {
  it("reconhece variantes regionais do inglês", () => {
    expect(isEnglishVoice({ lang: "en-US" })).toBe(true);
    expect(isEnglishVoice({ lang: "en-GB" })).toBe(true);
    expect(isEnglishVoice({ lang: "pt-BR" })).toBe(false);
  });

  it("prioriza uma voz natural em inglês americano", () => {
    const natural = voiceQualityScore({
      default: false,
      lang: "en-US",
      localService: false,
      name: "Microsoft Aria Online (Natural)",
    });
    const generic = voiceQualityScore({
      default: true,
      lang: "en-GB",
      localService: true,
      name: "English",
    });
    expect(natural).toBeGreaterThan(generic);
  });

  it("reconhece as vozes naturais recentes do Edge", () => {
    const ava = voiceQualityScore({
      default: false,
      lang: "en-US",
      localService: false,
      name: "Microsoft Ava Online (Natural) - English (United States)",
    });
    const legacy = voiceQualityScore({
      default: true,
      lang: "en-US",
      localService: true,
      name: "Microsoft David Desktop",
    });
    expect(ava).toBeGreaterThan(legacy);
  });

  it("nunca escolhe uma voz masculina como fallback", () => {
    const voices = [
      { default: true, lang: "en-US", localService: true, name: "Microsoft David Desktop" },
      { default: false, lang: "en-US", localService: false, name: "Microsoft Aria Online" },
    ] as SpeechSynthesisVoice[];

    expect(findFemaleEnglishVoice(voices)?.name).toContain("Aria");
  });
});
