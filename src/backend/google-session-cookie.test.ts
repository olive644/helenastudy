import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  clearCookieHeader,
  decryptSession,
  encryptSession,
  readCookie,
  setCookieHeader,
} from "./google-session-cookie";

const secret = randomBytes(32).toString("base64");
const tokens = { accessToken: "access-1", refreshToken: "refresh-1", expiresAt: 123 };

describe("sessão cifrada do Google Agenda", () => {
  it("cifra e decifra os tokens", () => {
    const cookieValue = encryptSession(secret, tokens);
    expect(cookieValue).not.toContain("refresh-1");
    expect(decryptSession(secret, cookieValue)).toEqual(tokens);
  });

  it("rejeita cookie adulterado ou com chave errada", () => {
    const cookieValue = encryptSession(secret, tokens);
    expect(decryptSession(secret, `${cookieValue}x`)).toBeUndefined();
    expect(decryptSession(randomBytes(32).toString("base64"), cookieValue)).toBeUndefined();
  });

  it("lê um cookie específico de um cabeçalho com vários", () => {
    const request = new Request("https://helena.example", {
      headers: { Cookie: "a=1; hs_google_session=abc%3D%3D; b=2" },
    });
    expect(readCookie(request, "hs_google_session")).toBe("abc==");
    expect(readCookie(request, "ausente")).toBeUndefined();
  });

  it("gera cabeçalhos de cookie seguros", () => {
    expect(setCookieHeader("hs_google_session", "valor")).toContain("HttpOnly");
    expect(setCookieHeader("hs_google_session", "valor")).toContain("Secure");
    expect(clearCookieHeader("hs_google_session")).toContain("Max-Age=0");
  });
});
