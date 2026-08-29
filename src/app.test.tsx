import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./app";

function navigate(label: string) {
  const navigation = screen.getByRole("navigation", { name: "Navegação principal" });
  fireEvent.click(within(navigation).getByRole("button", { name: label }));
}

describe("App", () => {
  it("apresenta a central local com a Helena original", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /organize seu dia de estudos/i })).toBeTruthy();
    expect(screen.getByText(/salvo somente neste dispositivo/i)).toBeTruthy();
    expect(screen.getByAltText(/helena, a gata preta/i).getAttribute("src")).toBe("/helena.svg");
  });

  it("cria uma tarefa, mostra em Hoje e permite concluí-la", () => {
    render(<App />);
    navigate("Agenda");
    fireEvent.change(screen.getByLabelText(/o que precisa ser feito/i), {
      target: { value: "Revisar phrasal verbs" },
    });
    fireEvent.click(screen.getByRole("button", { name: /adicionar tarefa/i }));

    navigate("Hoje");
    expect(screen.getByText("Revisar phrasal verbs")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /concluir revisar phrasal verbs/i }));
    expect(screen.queryByText("Revisar phrasal verbs")).toBeNull();
  });

  it("cria hábito e anotação usando o mesmo espaço local", () => {
    render(<App />);
    navigate("Hábitos");
    fireEvent.change(screen.getByLabelText(/nome do hábito/i), {
      target: { value: "Ler em inglês" },
    });
    fireEvent.click(screen.getByRole("button", { name: /adicionar hábito/i }));
    const habitButton = screen.getByRole("button", { name: /ler em inglês/i });
    fireEvent.click(habitButton);
    expect(habitButton.getAttribute("aria-pressed")).toBe("true");

    navigate("Cadernos");
    fireEvent.click(screen.getByRole("button", { name: /nova anotação/i }));
    fireEvent.change(screen.getByLabelText(/título da anotação/i), {
      target: { value: "Vocabulário" },
    });
    fireEvent.change(screen.getByLabelText(/conteúdo da anotação/i), {
      target: { value: "Improve: melhorar" },
    });
    expect(screen.getByDisplayValue("Improve: melhorar")).toBeTruthy();
  });

  it("mantém dados após remontar o aplicativo", () => {
    const firstRender = render(<App />);
    navigate("Agenda");
    fireEvent.change(screen.getByLabelText(/o que precisa ser feito/i), {
      target: { value: "Preparar apresentação" },
    });
    fireEvent.click(screen.getByRole("button", { name: /adicionar tarefa/i }));
    firstRender.unmount();

    render(<App />);
    expect(screen.getByText("Preparar apresentação")).toBeTruthy();
  });

  it("preserva o criador de planos de aula", () => {
    render(<App />);
    navigate("Planos de aula");
    fireEvent.change(screen.getByLabelText(/tema da aula/i), {
      target: { value: "Simple Past" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar rascunho/i }));
    expect(screen.getByRole("heading", { name: "Simple Past" })).toBeTruthy();
    expect(screen.getByText("Warm-up")).toBeTruthy();
  });
});
