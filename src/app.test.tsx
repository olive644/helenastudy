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
    expect(screen.getByRole("heading", { name: "Espaço do aluno" })).toBeTruthy();
    expect(screen.getByText(/dados salvos neste dispositivo/i)).toBeTruthy();
    expect(screen.getByAltText(/helena, a gata preta/i).getAttribute("src")).toBe("/helena.svg");
    expect(screen.queryByText(/by oli/i)).toBeNull();
  });

  it("organiza as ferramentas secundárias no menu móvel", () => {
    render(<App />);
    const mobileNavigation = screen.getByRole("navigation", { name: "Navegação móvel" });
    expect(within(mobileNavigation).getAllByRole("button")).toHaveLength(5);
    fireEvent.click(within(mobileNavigation).getByRole("button", { name: "Mais" }));

    const moreMenu = screen.getByRole("dialog", { name: "Mais ferramentas" });
    fireEvent.click(within(moreMenu).getByRole("button", { name: "Hábitos" }));
    expect(
      screen.getByRole("heading", { name: /consistência antes de intensidade/i }),
    ).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "Mais ferramentas" })).toBeNull();
  });

  it("cria uma tarefa, mostra no Espaço do aluno e permite concluí-la", () => {
    render(<App />);
    navigate("Agenda");
    fireEvent.change(screen.getByLabelText(/o que precisa ser feito/i), {
      target: { value: "Revisar phrasal verbs" },
    });
    fireEvent.click(screen.getByRole("button", { name: /adicionar tarefa/i }));

    navigate("Espaço do aluno");
    expect(screen.getByText("Revisar phrasal verbs")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /concluir revisar phrasal verbs/i }));
    expect(screen.queryByText("Revisar phrasal verbs")).toBeNull();
  });

  it("cria hábito e anotação usando o mesmo espaço local", async () => {
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
    fireEvent.click(await screen.findByRole("button", { name: /nova anotação/i }));
    fireEvent.change(screen.getByLabelText(/título da anotação/i), {
      target: { value: "Vocabulário" },
    });
    fireEvent.change(screen.getByLabelText(/conteúdo da anotação/i), {
      target: { value: "Improve: melhorar" },
    });
    expect(screen.getByDisplayValue("Improve: melhorar")).toBeTruthy();
  });

  it("oferece digitalização e escrita à mão dentro de uma anotação", async () => {
    render(<App />);
    navigate("Cadernos");
    fireEvent.click(await screen.findByRole("button", { name: /nova anotação/i }));

    expect(await screen.findByRole("button", { name: "Digitalizar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Escrever à mão" })).toBeTruthy();
  });

  it("cria e completa uma linha no bingo de estudos", async () => {
    render(<App />);
    navigate("Quizzes e bingo");
    fireEvent.click(await screen.findByRole("button", { name: "Bingo" }));
    fireEvent.click(screen.getByRole("button", { name: "Criar bingo" }));

    const board = screen.getByRole("group", { name: "Cartela de bingo" });
    const cells = within(board).getAllByRole("button");
    expect(cells).toHaveLength(9);
    cells.slice(0, 3).forEach((cell) => fireEvent.click(cell));
    expect(screen.getByRole("status").textContent).toMatch(/bingo/i);
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

  it("preserva o criador de planos de aula", async () => {
    render(<App />);
    navigate("Planos de aula");
    fireEvent.change(await screen.findByLabelText(/tema da aula/i), {
      target: { value: "Simple Past" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar rascunho/i }));
    expect(screen.getByRole("heading", { name: "Simple Past" })).toBeTruthy();
    expect(screen.getByText("Warm-up")).toBeTruthy();
  });

  it("cria e revisa um flashcard local", async () => {
    render(<App />);
    navigate("Biblioteca");
    const front = await screen.findByLabelText("Frente");
    fireEvent.change(front, { target: { value: "Improve" } });
    fireEvent.change(screen.getByLabelText("Verso"), { target: { value: "Melhorar" } });
    fireEvent.click(screen.getByRole("button", { name: /criar flashcard/i }));
    expect(screen.getByText("Improve")).toBeTruthy();

    navigate("Quizzes e bingo");
    expect(await screen.findByRole("heading", { name: "Improve" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /mostrar resposta/i }));
    expect(screen.getByRole("heading", { name: "Melhorar" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fácil" }));
    expect(screen.getByText(/revisão em dia/i)).toBeTruthy();
  });
});
