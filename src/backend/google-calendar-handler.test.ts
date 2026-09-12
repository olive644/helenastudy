import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createGoogleCalendarHandler } from "./google-calendar-handler";
import {
  encryptSession,
  GOOGLE_SESSION_COOKIE,
  GOOGLE_STATE_COOKIE,
} from "./google-session-cookie";

const origin = "https://helena.example";
const sessionSecret = randomBytes(32).toString("base64");
const config = {
  clientId: "client-1",
  clientSecret: "secret-1",
  redirectUri: `${origin}/api/google-calendar?action=callback`,
};

function get(path: string, cookie?: string): Request {
  return new Request(`${origin}/api/google-calendar${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
  });
}

function post(path: string, cookie?: string): Request {
  return new Request(`${origin}/api/google-calendar${path}`, {
    method: "POST",
    headers: cookie ? { Cookie: cookie } : {},
  });
}

function handler(fetchImpl: typeof fetch) {
  return createGoogleCalendarHandler({
    config,
    sessionSecret,
    fetchImpl,
    now: () => Date.parse("2026-09-10T00:00:00Z"),
    randomState: () => "fixed-state",
    appUrl: () => origin,
  });
}

describe("handler do Google Agenda", () => {
  it("redireciona para o Google com estado em cookie", async () => {
    const response = await handler(vi.fn())(get("?action=connect"));
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get("Location")!);
    expect(location.hostname).toBe("accounts.google.com");
    expect(location.searchParams.get("state")).toBe("fixed-state");
    expect(response.headers.get("Set-Cookie")).toContain(GOOGLE_STATE_COOKIE);
  });

  it("recusa callback com estado divergente", async () => {
    const response = await handler(vi.fn())(
      get(`?action=callback&code=c1&state=outro`, `${GOOGLE_STATE_COOKIE}=fixed-state`),
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(`${origin}?google=erro`);
  });

  it("troca o código e conecta na sessão", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: "a1", refresh_token: "r1", expires_in: 3600 }), {
        status: 200,
      }),
    );
    const response = await handler(fetchImpl)(
      get(`?action=callback&code=c1&state=fixed-state`, `${GOOGLE_STATE_COOKIE}=fixed-state`),
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(`${origin}?google=conectado`);
    expect(
      response.headers.getSetCookie().some((value) => value.includes(GOOGLE_SESSION_COOKIE)),
    ).toBe(true);
  });

  it("informa status desconectado sem cookie", async () => {
    const response = await handler(vi.fn())(get("?action=status"));
    expect(await response.json()).toEqual({ connected: false });
  });

  it("exige sessão para listar eventos", async () => {
    const response = await handler(vi.fn())(get("?action=events"));
    expect(response.status).toBe(401);
  });

  it("lista eventos com sessão válida e renova token vencido", async () => {
    const expiredCookie = encryptSession(sessionSecret, {
      accessToken: "old",
      refreshToken: "r1",
      expiresAt: Date.parse("2026-09-09T00:00:00Z"),
    });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "new", expires_in: 3600 }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }));
    const response = await handler(fetchImpl)(
      get("?action=events", `${GOOGLE_SESSION_COOKIE}=${expiredCookie}`),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ events: [] });
    expect(
      response.headers.getSetCookie().some((value) => value.includes(GOOGLE_SESSION_COOKIE)),
    ).toBe(true);
  });

  it("desconecta limpando o cookie de sessão", async () => {
    const response = await handler(vi.fn())(post("?action=disconnect"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
  });
});
