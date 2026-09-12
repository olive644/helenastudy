import { fireEvent, render, screen } from "@testing-library/react";
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

  it("normaliza o código colado e só libera a entrada com os dois campos válidos", () => {
    render(<LocalRoom />);
    fireEvent.click(screen.getByRole("button", { name: /entrar com código/i }));

    const submit = screen.getByRole("button", { name: /^entrar$/i });
    expect(submit.hasAttribute("disabled")).toBe(true);
    fireEvent.paste(screen.getByLabelText(/código/i), {
      clipboardData: { getData: () => "ab-c de" },
    });
    fireEvent.change(screen.getByLabelText(/nome de exibição/i), { target: { value: "Ana" } });

    expect((screen.getByLabelText(/código/i) as HTMLInputElement).value).toBe("ABCDE");
    expect(submit.hasAttribute("disabled")).toBe(false);
  });
});
