import { describe, expect, it, vi } from "vitest";
import {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  listUpcomingEvents,
  refreshAccessToken,
  type GoogleOAuthConfig,
} from "./google-calendar-oauth";

const config: GoogleOAuthConfig = {
  clientId: "client-1",
  clientSecret: "secret-1",
  redirectUri: "https://helena.example/api/google-calendar?action=callback",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("OAuth do Google Agenda", () => {
  it("monta a URL de autorização com escopo somente leitura", () => {
    const url = new URL(buildAuthorizationUrl(config, "state-1"));
    expect(url.searchParams.get("client_id")).toBe("client-1");
    expect(url.searchParams.get("scope")).toContain("calendar.events.readonly");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("state")).toBe("state-1");
  });

  it("troca o código por tokens", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { access_token: "a1", refresh_token: "r1", expires_in: 3600 }),
      );
    const tokens = await exchangeCodeForTokens(config, "code-1", fetchImpl);
    expect(tokens.accessToken).toBe("a1");
    expect(tokens.refreshToken).toBe("r1");
    expect(tokens.expiresAt).toBeGreaterThan(Date.now());
  });

  it("recusa resposta sem refresh token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { access_token: "a1" }));
    await expect(exchangeCodeForTokens(config, "code-1", fetchImpl)).rejects.toThrow();
  });

  it("renova o access token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { access_token: "a2", expires_in: 3600 }));
    const refreshed = await refreshAccessToken(config, "r1", fetchImpl);
    expect(refreshed.accessToken).toBe("a2");
  });

  it("lista eventos futuros normalizados", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        items: [
          {
            id: "e1",
            summary: "Aula de inglês",
            htmlLink: "https://calendar.google.com/e1",
            start: { dateTime: "2026-09-10T18:00:00-03:00" },
            end: { dateTime: "2026-09-10T19:00:00-03:00" },
          },
          {
            id: "e2",
            htmlLink: "https://calendar.google.com/e2",
            start: { date: "2026-09-11" },
            end: { date: "2026-09-12" },
          },
        ],
      }),
    );
    const events = await listUpcomingEvents(
      "a1",
      { timeMinISO: "2026-09-10T00:00:00Z", timeMaxISO: "2026-09-24T00:00:00Z" },
      fetchImpl,
    );
    expect(events).toEqual([
      {
        id: "e1",
        title: "Aula de inglês",
        start: "2026-09-10T18:00:00-03:00",
        end: "2026-09-10T19:00:00-03:00",
        allDay: false,
        htmlLink: "https://calendar.google.com/e1",
      },
      {
        id: "e2",
        title: "(Sem título)",
        start: "2026-09-11",
        end: "2026-09-12",
        allDay: true,
        htmlLink: "https://calendar.google.com/e2",
      },
    ]);
  });

  it("sinaliza token expirado com status 401", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    await expect(
      listUpcomingEvents(
        "a1",
        { timeMinISO: "2026-09-10T00:00:00Z", timeMaxISO: "2026-09-24T00:00:00Z" },
        fetchImpl,
      ),
    ).rejects.toMatchObject({ status: 401 });
  });
});
