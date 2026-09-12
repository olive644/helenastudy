import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HelenaLoading } from "./helena-loading";

describe("HelenaLoading", () => {
  it("anuncia o estado de carregamento sem duplicar a mascote no leitor de tela", () => {
    const { container } = render(<HelenaLoading label="Abrindo módulo…" />);

    expect(screen.getByRole("status").textContent).toBe("Abrindo módulo…");
    expect(container.querySelector("img")?.getAttribute("aria-hidden")).toBe("true");
  });
});
