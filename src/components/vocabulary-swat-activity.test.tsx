import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { VocabularySwatActivity } from "./vocabulary-swat-activity";

test("explica a dinâmica e oferece oito mãos para impressão", () => {
  const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);
  render(<VocabularySwatActivity />);

  expect(screen.getByRole("heading", { name: "Mão no vocabulário" })).toBeTruthy();
  expect(screen.getByText(/a mão é apenas o “mata-mosca”/i)).toBeTruthy();

  const sheet = screen.getByLabelText("Folha com moldes de mãos para imprimir");
  expect(within(sheet).getAllByRole("img", { name: /molde de mão/i })).toHaveLength(8);

  fireEvent.click(screen.getByRole("button", { name: "Imprimir molde das mãos" }));
  expect(printSpy).toHaveBeenCalledOnce();
});
