import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalRoom } from "./local-room";

describe("chegada por link de convite", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pula a tela inicial e já mostra o formulário de entrar com o código preenchido", () => {
    render(<LocalRoom initialJoinCode="ABCDE" />);
    expect(screen.getByText(/entrar em uma sala/i)).toBeTruthy();
    expect((screen.getByLabelText(/código/i) as HTMLInputElement).value).toBe("ABCDE");
  });

  it("sem código de convite, mostra a tela inicial normal", () => {
    render(<LocalRoom />);
    expect(screen.getByText(/^modo sala$/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /criar sala/i })).toBeTruthy();
  });
});
