import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { getGoogleAccessToken } from "./google-service-account";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const account = { clientEmail: "sala@helenastudy.iam.gserviceaccount.com", privateKey };

function decodeBase64url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

describe("autenticação de conta de serviço do Google", () => {
  it("monta e assina um JWT Bearer válido e troca por access token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ access_token: "token-1" }), { status: 200 }),
      );

    const token = await getGoogleAccessToken(
      account,
      ["https://www.googleapis.com/auth/firebase.database"],
      fetchImpl,
      Date.parse("2026-09-10T00:00:00Z"),
    );
    expect(token).toBe("token-1");

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    const body = new URLSearchParams(init.body as string);
    expect(body.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");

    const assertion = body.get("assertion")!;
    const [headerPart, claimsPart, signaturePart] = assertion.split(".");
    expect(JSON.parse(decodeBase64url(headerPart!))).toEqual({ alg: "RS256", typ: "JWT" });
    const claims = JSON.parse(decodeBase64url(claimsPart!)) as Record<string, unknown>;
    expect(claims["iss"]).toBe(account.clientEmail);
    expect(claims["scope"]).toBe("https://www.googleapis.com/auth/firebase.database");
    expect(claims["exp"]).toBe((claims["iat"] as number) + 3600);

    const verifier = createVerify("RSA-SHA256").update(`${headerPart}.${claimsPart}`);
    expect(verifier.verify(publicKey, Buffer.from(signaturePart!, "base64url"))).toBe(true);
  });

  it("propaga erro quando o Google recusa a autenticação", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }));
    await expect(getGoogleAccessToken(account, ["scope"], fetchImpl)).rejects.toThrow(
      "invalid_grant",
    );
  });
});
