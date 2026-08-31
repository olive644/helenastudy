import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListeningQuiz } from "./listening-quiz";

describe("feedback do quiz de escuta", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.999);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function reachAnswer() {
    render(<ListeningQuiz flashcards={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /iniciar escuta/i }));
    act(() => vi.advanceTimersByTime(2200));
  }

  it("nunca apresenta uma resposta errada como acerto", () => {
    reachAnswer();
    fireEvent.change(screen.getByLabelText(/o que você ouviu/i), { target: { value: "errado" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(screen.getByText("Ainda não")).toBeTruthy();
    expect(screen.getByText(/você respondeu:/i)).toBeTruthy();
    expect(screen.queryByText("Resposta correta", { selector: "small" })).toBeNull();
    expect(screen.getByText("0 acertos")).toBeTruthy();
  });

  it("a resposta correta incrementa a pontuação somente uma vez", () => {
    reachAnswer();
    const input = screen.getByLabelText(/o que você ouviu/i);
    fireEvent.change(input, { target: { value: "escola" } });
    const confirm = screen.getByRole("button", { name: "Confirmar" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(screen.getByText("Resposta correta", { selector: "small" })).toBeTruthy();
    expect(screen.getByText("1 acertos")).toBeTruthy();
  });
});
