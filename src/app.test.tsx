import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./app";

describe("App", () => {
  it("apresenta o posicionamento e informa que a versão é local", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /o que você vai ensinar hoje/i })).toBeTruthy();
    expect(screen.getByText(/os dados ficam neste dispositivo/i)).toBeTruthy();
    expect(screen.getByAltText(/helena, a gata preta/i).getAttribute("src")).toBe("/helena.svg");
  });

  it("monta uma estrutura de aula pelo fluxo principal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /criar plano de aula/i }));
    fireEvent.change(screen.getByLabelText(/tema da aula/i), {
      target: { value: "Simple Past" },
    });
    fireEvent.change(screen.getByLabelText(/perfil da turma/i), {
      target: { value: "Adultos" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar rascunho/i }));

    expect(screen.getByRole("heading", { name: "Simple Past" })).toBeTruthy();
    expect(screen.getByText("Warm-up")).toBeTruthy();
    expect(screen.getByText("Produção")).toBeTruthy();
    expect(screen.getByText(/estrutura criada localmente/i)).toBeTruthy();
  });
});
