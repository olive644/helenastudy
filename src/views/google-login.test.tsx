import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GoogleLogin } from "./google-login";

it("does not complete login when Firebase configuration is unavailable", async () => {
  vi.stubEnv("VITE_FIREBASE_API_KEY", "");
  const finish = vi.fn();
  const back = vi.fn();
  render(<GoogleLogin answers={[]} onFinish={finish} onBack={back} />);
  await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  expect(screen.getByRole("button", { name: "Entrar com Google" }).hasAttribute("disabled")).toBe(
    true,
  );
  expect(finish).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
  expect(back).toHaveBeenCalledOnce();
  vi.unstubAllEnvs();
});
