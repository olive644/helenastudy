import type { IncomingMessage, ServerResponse } from "node:http";
import { createGeminiSpeechProvider } from "../src/backend/gemini-speech-provider.js";
import { createSpeechHandler } from "../src/backend/speech-handler.js";

const requests = new Map<string, number[]>();

const handler = createSpeechHandler({
  identifyClient(request) {
    return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  },
  rateLimiter: {
    consume(clientId) {
      const now = Date.now();
      const recent = (requests.get(clientId) ?? []).filter((time) => now - time < 60_000);
      if (recent.length >= 30) return false;
      recent.push(now);
      requests.set(clientId, recent);
      return true;
    },
  },
  provider: createGeminiSpeechProvider(process.env["GEMINI_API_KEY"] ?? ""),
});

type VercelRequest = IncomingMessage & { body?: unknown };

async function readBody(request: VercelRequest): Promise<string | undefined> {
  if (request.body !== undefined) {
    return typeof request.body === "string" ? request.body : JSON.stringify(request.body);
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk);
  }
  return chunks.length === 0 ? undefined : Buffer.concat(chunks).toString("utf8");
}

async function toWebRequest(request: VercelRequest): Promise<Request> {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  const protocol = headers.get("x-forwarded-proto") ?? "https";
  const host = headers.get("host") ?? "localhost";
  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await readBody(request);
  return new Request(`${protocol}://${host}${request.url ?? "/api/speech"}`, {
    method: request.method ?? "GET",
    headers,
    ...(body === undefined ? {} : { body }),
  });
}

export default async function speech(
  request: Request | VercelRequest,
  response?: ServerResponse,
): Promise<Response | void> {
  if (request instanceof Request) return handler(request);

  const result = await handler(await toWebRequest(request));
  if (!response) return result;
  response.statusCode = result.status;
  result.headers.forEach((value, name) => response.setHeader(name, value));
  response.end(Buffer.from(await result.arrayBuffer()));
}
