import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("organiza uma tarefa e mantém o dado após recarregar", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /organize seu dia de estudos/i })).toBeVisible();
  await expect(page.getByAltText(/helena, a gata preta/i)).toHaveAttribute("src", "/helena.svg");

  await page.getByRole("button", { name: "Agenda", exact: true }).click();
  await page.getByLabel(/o que precisa ser feito/i).fill("Revisar Simple Past");
  await page.getByRole("button", { name: /adicionar tarefa/i }).click();
  await page.getByRole("button", { name: "Hoje", exact: true }).click();
  await expect(page.getByText("Revisar Simple Past")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Revisar Simple Past")).toBeVisible();
});

test("preserva o criador de planos de aula", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "O atalho mobile fica na tela Hoje.");
  await page.getByRole("button", { name: /planos de aula/i }).click();
  await page.getByLabel(/tema da aula/i).fill("Simple Past");
  await page.getByLabel(/perfil da turma/i).fill("Adultos iniciantes");
  await page.getByRole("button", { name: /criar rascunho/i }).click();
  await expect(page.getByRole("heading", { name: "Simple Past" })).toBeVisible();
  await expect(page.getByText("Warm-up")).toBeVisible();
});

test("cria um flashcard e conclui a revisão", async ({ page }) => {
  const quickActions = page.getByRole("region", { name: "Ações rápidas" });
  await quickActions.getByRole("button", { name: /biblioteca/i }).click();
  await page.getByLabel("Frente").fill("Improve");
  await page.getByLabel("Verso").fill("Melhorar");
  await page.getByRole("button", { name: /criar flashcard/i }).click();

  await page.getByRole("button", { name: "Hoje", exact: true }).click();
  await quickActions.getByRole("button", { name: /revisar/i }).click();
  await expect(page.getByRole("heading", { name: "Improve" })).toBeVisible();
  await page.getByRole("button", { name: /mostrar resposta/i }).click();
  await expect(page.getByRole("heading", { name: "Melhorar" })).toBeVisible();
  await page.getByRole("button", { name: "Fácil" }).click();
  await expect(page.getByText(/revisão em dia/i)).toBeVisible();
});

test("mantém os módulos acessíveis e sem rolagem horizontal no celular", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Contrato específico da navegação móvel.");
  const navigation = page.getByRole("navigation", { name: "Navegação móvel" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("button")).toHaveCount(5);

  for (const label of ["Agenda", "Foco", "Hábitos", "Notas", "Hoje"]) {
    await navigation.getByRole("button", { name: label, exact: true }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
  }
});
