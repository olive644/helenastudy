import {
  parseHelenaError,
  parseHelenaRequest,
  parseHelenaResponse,
  type HelenaErrorCode,
  type HelenaRequest,
  type HelenaResponse,
} from "../ai/helena-contract";

const HELENA_ENDPOINT = "/api/helena";
const MAX_RESPONSE_LENGTH = 32_000;

export class HelenaClientError extends Error {
  readonly code: HelenaErrorCode;

  constructor(code: HelenaErrorCode, message: string) {
    super(message);
    this.name = "HelenaClientError";
    this.code = code;
  }
}

type HelenaClientOptions = {
  fetcher?: typeof fetch;
  signal?: AbortSignal;
};

export async function requestHelena(
  request: HelenaRequest,
  options: HelenaClientOptions = {},
): Promise<HelenaResponse> {
  const parsedRequest = parseHelenaRequest(request);
  if (!parsedRequest.ok) throw new HelenaClientError("invalid_request", parsedRequest.message);

  const fetcher = options.fetcher ?? globalThis.fetch;
  const init: RequestInit = {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(parsedRequest.value),
  };
  if (options.signal) init.signal = options.signal;

  const response = await fetcher(HELENA_ENDPOINT, init);
  const text = await response.text();
  if (text.length > MAX_RESPONSE_LENGTH) {
    throw new HelenaClientError(
      "provider_unavailable",
      "A resposta recebida excedeu o limite seguro.",
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text) as unknown;
  } catch {
    throw new HelenaClientError(
      "provider_unavailable",
      "O serviço retornou uma resposta inválida.",
    );
  }

  if (!response.ok) {
    const parsedError = parseHelenaError(payload);
    if (parsedError.ok) {
      throw new HelenaClientError(parsedError.value.error.code, parsedError.value.error.message);
    }
    throw new HelenaClientError("provider_unavailable", "A Helena está indisponível no momento.");
  }

  const parsedResponse = parseHelenaResponse(payload);
  if (!parsedResponse.ok) {
    throw new HelenaClientError("provider_unavailable", parsedResponse.message);
  }
  return parsedResponse.value;
}
