import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { GoogleTokens } from "./google-calendar-oauth.js";

export const GOOGLE_SESSION_COOKIE = "hs_google_session";
export const GOOGLE_STATE_COOKIE = "hs_google_state";

// AES-256-GCM: o cookie guarda o refresh token do usuário, então cifrar (não
// só assinar) evita expor o token do Google caso o cookie vaze por algum
// outro meio (log, extensão de navegador, etc).
function deriveKey(secret: string): Buffer {
  const raw = Buffer.from(secret, "base64");
  if (raw.byteLength !== 32) {
    throw new Error("GOOGLE_SESSION_SECRET deve ser uma chave base64 de 32 bytes.");
  }
  return raw;
}

export function encryptSession(secret: string, tokens: GoogleTokens): string {
  const key = deriveKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(tokens), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

export function decryptSession(secret: string, cookieValue: string): GoogleTokens | undefined {
  try {
    const key = deriveKey(secret);
    const raw = Buffer.from(cookieValue, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const tokens = JSON.parse(plaintext.toString("utf8")) as GoogleTokens;
    if (
      typeof tokens.accessToken === "string" &&
      typeof tokens.refreshToken === "string" &&
      typeof tokens.expiresAt === "number"
    ) {
      return tokens;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("Cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function setCookieHeader(
  name: string,
  value: string,
  options: { maxAgeSeconds?: number } = {},
): string {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ];
  attributes.push(`Max-Age=${options.maxAgeSeconds ?? 60 * 60 * 24 * 90}`);
  return attributes.join("; ");
}

export function clearCookieHeader(name: string): string {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
