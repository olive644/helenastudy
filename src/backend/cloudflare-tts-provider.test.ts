import { afterEach, describe, expect, it, vi } from "vitest";
import { createCloudflareTtsProvider } from "./cloudflare-tts-provider";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("provedor Cloudflare Workers AI (MeloTTS)", () => {
  it("envia o token e devolve o audio mp3 recebido", async () => {
    const audio = new Uint8Array([1, 2, 3, 4]);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(audio.buffer as ArrayBuffer, {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = createCloudflareTtsProvider("account-123", "token-abc", 5000);
    const result = await provider.synthesize({ text: "hello", rate: 0.86, consent: true });

    expect(result).toEqual({ audio, contentType: "audio/mpeg" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/account-123/ai/run/@cf/myshell-ai/melotts",
    );
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer token-abc");
    expect(JSON.parse(init.body as string)).toEqual({ prompt: "hello", lang: "en" });
  });

  it("decodifica o audio quando a resposta vem em JSON com base64 (formato real da API)", async () => {
    const audioBytes = new Uint8Array([10, 20, 30, 40]);
    const base64Audio = Buffer.from(audioBytes).toString("base64");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: { audio: base64Audio }, success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = createCloudflareTtsProvider("account-123", "token-abc", 5000);
    const result = await provider.synthesize({ text: "hello", rate: 0.86, consent: true });

    expect(result).toEqual({ audio: audioBytes, contentType: "audio/mpeg" });
  });

  it("lanca erro quando a resposta HTTP nao e ok", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response("erro", { status: 401, headers: { "Content-Type": "application/json" } }),
      ) as unknown as typeof fetch;
    const provider = createCloudflareTtsProvider("account-123", "token-abc", 5000);

    await expect(
      provider.synthesize({ text: "hello", rate: 0.86, consent: true }),
    ).rejects.toMatchObject({ providerStatus: 401 });
  });

  it("lanca erro quando a resposta nao e audio mesmo com status 200", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch;
    const provider = createCloudflareTtsProvider("account-123", "token-abc", 5000);

    await expect(
      provider.synthesize({ text: "hello", rate: 0.86, consent: true }),
    ).rejects.toMatchObject({ providerStatus: 502 });
  });

  it("recusa sintetizar quando o provedor nao esta configurado", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const provider = createCloudflareTtsProvider("", "", 5000);

    await expect(
      provider.synthesize({ text: "hello", rate: 0.86, consent: true }),
    ).rejects.toMatchObject({ providerStatus: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
