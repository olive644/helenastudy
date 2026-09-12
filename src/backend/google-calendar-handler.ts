import {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  listUpcomingEvents,
  refreshAccessToken,
  type GoogleOAuthConfig,
  type GoogleTokens,
} from "./google-calendar-oauth.js";
import {
  clearCookieHeader,
  decryptSession,
  encryptSession,
  GOOGLE_SESSION_COOKIE,
  GOOGLE_STATE_COOKIE,
  readCookie,
  setCookieHeader,
} from "./google-session-cookie.js";

const EVENTS_WINDOW_DAYS = 14;
const STATE_MAX_AGE_SECONDS = 600;

export type GoogleCalendarHandlerDependencies = {
  config: GoogleOAuthConfig;
  sessionSecret: string;
  fetchImpl?: typeof fetch;
  now?(): number;
  randomState?(): string;
  appUrl(request: Request): string;
};

function jsonResponse(status: number, body: unknown, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function redirectResponse(location: string, extraHeaders: HeadersInit = {}): Response {
  return new Response(null, { status: 302, headers: { Location: location, ...extraHeaders } });
}

async function ensureFreshTokens(
  dependencies: GoogleCalendarHandlerDependencies,
  tokens: GoogleTokens,
): Promise<GoogleTokens> {
  const now = dependencies.now?.() ?? Date.now();
  if (tokens.expiresAt - now > 60_000) return tokens;
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const refreshed = await refreshAccessToken(dependencies.config, tokens.refreshToken, fetchImpl);
  return { ...tokens, accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt };
}

export function createGoogleCalendarHandler(dependencies: GoogleCalendarHandlerDependencies) {
  return async function handleGoogleCalendar(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const fetchImpl = dependencies.fetchImpl ?? fetch;
    const now = dependencies.now?.() ?? Date.now();

    if (action === "connect" && request.method === "GET") {
      const state = dependencies.randomState?.() ?? crypto.randomUUID();
      const authUrl = buildAuthorizationUrl(dependencies.config, state);
      return redirectResponse(authUrl, {
        "Set-Cookie": setCookieHeader(GOOGLE_STATE_COOKIE, state, {
          maxAgeSeconds: STATE_MAX_AGE_SECONDS,
        }),
      });
    }

    if (action === "callback" && request.method === "GET") {
      const appUrl = dependencies.appUrl(request);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const expectedState = readCookie(request, GOOGLE_STATE_COOKIE);
      if (!code || !state || !expectedState || state !== expectedState) {
        return redirectResponse(`${appUrl}?google=erro`, {
          "Set-Cookie": clearCookieHeader(GOOGLE_STATE_COOKIE),
        });
      }
      try {
        const tokens = await exchangeCodeForTokens(dependencies.config, code, fetchImpl);
        const sessionValue = encryptSession(dependencies.sessionSecret, tokens);
        const response = redirectResponse(`${appUrl}?google=conectado`);
        response.headers.append("Set-Cookie", setCookieHeader(GOOGLE_SESSION_COOKIE, sessionValue));
        response.headers.append("Set-Cookie", clearCookieHeader(GOOGLE_STATE_COOKIE));
        return response;
      } catch {
        return redirectResponse(`${appUrl}?google=erro`, {
          "Set-Cookie": clearCookieHeader(GOOGLE_STATE_COOKIE),
        });
      }
    }

    if (action === "status" && request.method === "GET") {
      const cookieValue = readCookie(request, GOOGLE_SESSION_COOKIE);
      const tokens = cookieValue
        ? decryptSession(dependencies.sessionSecret, cookieValue)
        : undefined;
      return jsonResponse(200, { connected: Boolean(tokens) });
    }

    if (action === "events" && request.method === "GET") {
      const cookieValue = readCookie(request, GOOGLE_SESSION_COOKIE);
      const tokens = cookieValue
        ? decryptSession(dependencies.sessionSecret, cookieValue)
        : undefined;
      if (!tokens) return jsonResponse(401, { error: "Não conectado ao Google Agenda." });
      try {
        const fresh = await ensureFreshTokens(dependencies, tokens);
        const timeMinISO = new Date(now).toISOString();
        const timeMaxISO = new Date(now + EVENTS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
        const events = await listUpcomingEvents(
          fresh.accessToken,
          { timeMinISO, timeMaxISO },
          fetchImpl,
        );
        const headers: HeadersInit =
          fresh.accessToken === tokens.accessToken
            ? {}
            : {
                "Set-Cookie": setCookieHeader(
                  GOOGLE_SESSION_COOKIE,
                  encryptSession(dependencies.sessionSecret, fresh),
                ),
              };
        return jsonResponse(200, { events }, headers);
      } catch {
        return jsonResponse(502, { error: "Não foi possível ler o Google Agenda agora." });
      }
    }

    if (action === "disconnect" && request.method === "POST") {
      return jsonResponse(
        200,
        { connected: false },
        { "Set-Cookie": clearCookieHeader(GOOGLE_SESSION_COOKIE) },
      );
    }

    return jsonResponse(404, { error: "Ação desconhecida." });
  };
}
