import { afterEach, beforeEach, expect, it, vi } from "vitest";

const initializeApp = vi.fn(() => ({ name: "helena-room" }));
const getToken = vi.fn(async () => ({ token: "fake-app-check-token" }));
const initializeAppCheck = vi.fn(() => ({}));
const ReCaptchaEnterpriseProvider = vi.fn();

vi.mock("firebase/app", () => ({ initializeApp }));
vi.mock("firebase/app-check", () => ({
  initializeAppCheck,
  getToken,
  ReCaptchaEnterpriseProvider,
}));

beforeEach(() => {
  vi.resetModules();
  initializeApp.mockClear();
  getToken.mockClear();
  initializeAppCheck.mockClear();
  ReCaptchaEnterpriseProvider.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

it("não busca token quando não há site key do App Check configurada", async () => {
  vi.stubEnv("VITE_FIREBASE_APPCHECK_SITE_KEY", "");
  const { roomAppCheckToken } = await import("./room-app-check");
  expect(await roomAppCheckToken()).toBeUndefined();
  expect(initializeApp).not.toHaveBeenCalled();
});

it("inicializa o App Check com reCAPTCHA Enterprise e retorna o token quando a site key existe", async () => {
  vi.stubEnv("VITE_FIREBASE_APPCHECK_SITE_KEY", "site-key-123");
  const { roomAppCheckToken } = await import("./room-app-check");
  const token = await roomAppCheckToken();
  expect(token).toBe("fake-app-check-token");
  expect(ReCaptchaEnterpriseProvider).toHaveBeenCalledWith("site-key-123");
  expect(initializeApp).toHaveBeenCalledTimes(1);
});

it("reaproveita a mesma instância do App Check entre chamadas (não reinicializa o Firebase)", async () => {
  vi.stubEnv("VITE_FIREBASE_APPCHECK_SITE_KEY", "site-key-123");
  const { roomAppCheckToken } = await import("./room-app-check");
  await roomAppCheckToken();
  await roomAppCheckToken();
  expect(initializeApp).toHaveBeenCalledTimes(1);
  expect(getToken).toHaveBeenCalledTimes(2);
});
