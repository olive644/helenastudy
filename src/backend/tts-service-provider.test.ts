import { afterEach, describe, expect, it, vi } from "vitest";
import { createTtsServiceProvider } from "./tts-service-provider";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("provedor do servico de TTS", () => {
  it("envia o segredo no header e devolve o audio recebido", async () => {
    const audio = new Uint8Array([82, 73, 70, 70]);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(audio.buffer as ArrayBuffer, { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = createTtsServiceProvider("https://tts.internal", "segredo", 5000);
    const result = await provider.synthesize({ text: "hello", rate: 0.86, consent: true });

    expect(result).toEqual({ audio, contentType: "audio/wav" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tts.internal/synthesize");
    expect((init.headers as Record<string, string>)["X-TTS-Secret"]).toBe("segredo");
    expect(JSON.parse(init.body as string)).toEqual({ text: "hello", rate: 0.86 });
  });

  it("lanca erro com o status do provedor quando a resposta nao e ok", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(new Response("erro", { status: 503 })) as unknown as typeof fetch;
    const provider = createTtsServiceProvider("https://tts.internal", "segredo", 5000);

    await expect(
      provider.synthesize({ text: "hello", rate: 0.86, consent: true }),
    ).rejects.toMatchObject({ providerStatus: 503 });
  });

  it("recusa sintetizar quando o servico nao esta configurado", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const provider = createTtsServiceProvider("", "", 5000);

    await expect(
      provider.synthesize({ text: "hello", rate: 0.86, consent: true }),
    ).rejects.toMatchObject({ providerStatus: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
