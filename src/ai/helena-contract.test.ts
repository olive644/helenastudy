import { describe, expect, it } from "vitest";
import {
  HELENA_API_VERSION,
  HELENA_MAX_SOURCE_COUNT,
  parseHelenaRequest,
  parseHelenaResponse,
  type HelenaRequest,
} from "./helena-contract";

function validRequest(): HelenaRequest {
  return {
    version: HELENA_API_VERSION,
    capability: "explain",
    prompt: "Explique este conceito.",
    sources: [
      { id: "note-1", kind: "note", title: "Present perfect", content: "Have + participle" },
    ],
    privacy: { consent: true, retention: "none" },
  };
}

describe("contrato da Helena", () => {
  it("aceita somente o conteúdo escolhido com consentimento explícito", () => {
    const result = parseHelenaRequest(validRequest());
    expect(result).toEqual({ ok: true, value: validRequest() });
  });

  it("rejeita campos extras para impedir o envio acidental do workspace", () => {
    const result = parseHelenaRequest({ ...validRequest(), workspace: { notes: ["privado"] } });
    expect(result).toEqual({ ok: false, message: "Requisição inválida." });
  });

  it("rejeita ausência de consentimento e excesso de fontes", () => {
    const withoutConsent = { ...validRequest(), privacy: { consent: false, retention: "none" } };
    expect(parseHelenaRequest(withoutConsent)).toEqual({
      ok: false,
      message: "Consentimento explícito é obrigatório.",
    });

    const tooManySources = {
      ...validRequest(),
      sources: Array.from({ length: HELENA_MAX_SOURCE_COUNT + 1 }, (_, index) => ({
        id: `note-${index}`,
        kind: "note",
        title: "Nota",
        content: "Conteúdo",
      })),
    };
    expect(parseHelenaRequest(tooManySources).ok).toBe(false);
  });

  it("rejeita respostas de provedor fora do limite", () => {
    expect(
      parseHelenaResponse({
        version: HELENA_API_VERSION,
        requestId: "request-1",
        answer: "Resposta",
        suggestions: Array.from({ length: 5 }, () => "Próximo passo"),
        generatedAt: "2026-08-30T00:00:00.000Z",
      }).ok,
    ).toBe(false);
  });
});
