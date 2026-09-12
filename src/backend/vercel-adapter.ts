import type { IncomingMessage, ServerResponse } from "node:http";

export type VercelRequest = IncomingMessage & { body?: unknown };

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

async function toWebRequest(request: VercelRequest, defaultPath: string): Promise<Request> {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  const protocol = headers.get("x-forwarded-proto") ?? "https";
  const host = headers.get("host") ?? "localhost";
  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await readBody(request);
  return new Request(`${protocol}://${host}${request.url ?? defaultPath}`, {
    method: request.method ?? "GET",
    headers,
    ...(body === undefined ? {} : { body }),
  });
}

export function createVercelHandler(
  defaultPath: string,
  handler: (request: Request) => Promise<Response>,
) {
  return async function vercelHandler(
    request: Request | VercelRequest,
    response?: ServerResponse,
  ): Promise<Response | void> {
    if (request instanceof Request) return handler(request);

    const result = await handler(await toWebRequest(request, defaultPath));
    if (!response) return result;
    response.statusCode = result.status;
    result.headers.forEach((value, name) => {
      if (name.toLowerCase() === "set-cookie") return;
      response.setHeader(name, value);
    });
    const setCookies =
      typeof (result.headers as { getSetCookie?: () => string[] }).getSetCookie === "function"
        ? (result.headers as unknown as { getSetCookie(): string[] }).getSetCookie()
        : result.headers.get("set-cookie")?.split(", ");
    if (setCookies?.length) response.setHeader("Set-Cookie", setCookies);
    response.end(Buffer.from(await result.arrayBuffer()));
  };
}
