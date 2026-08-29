import { describe, expect, it } from "vitest";
import { createInitialWorkspace } from "../domain/workspace";
import { loadWorkspace, saveWorkspace, WORKSPACE_STORAGE_KEY } from "./local-workspace";

describe("local workspace", () => {
  it("salva e recupera o estado versionado", () => {
    const workspace = createInitialWorkspace();
    saveWorkspace(window.localStorage, workspace);
    expect(loadWorkspace(window.localStorage)).toEqual(workspace);
  });

  it("ignora conteúdo inválido sem quebrar o aplicativo", () => {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, "{conteudo-invalido");
    expect(loadWorkspace(window.localStorage)).toEqual(createInitialWorkspace());
  });

  it("rejeita arrays com itens de formato inesperado", () => {
    const malformed = { ...createInitialWorkspace(), habits: [{ title: "Sem identificador" }] };
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(malformed));
    expect(loadWorkspace(window.localStorage)).toEqual(createInitialWorkspace());
  });
});
