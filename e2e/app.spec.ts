import { expect, test } from "@playwright/test";

test("cria o primeiro rascunho sem login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /o que você vai ensinar hoje/i })).toBeVisible();
  await expect(page.getByAltText(/helena, a gata preta/i)).toHaveAttribute("src", "/helena.svg");
  await page.getByRole("button", { name: /criar plano de aula/i }).click();
  await page.getByLabel(/tema da aula/i).fill("Simple Past");
  await page.getByLabel(/perfil da turma/i).fill("Adultos iniciantes");
  await page.getByRole("button", { name: /criar rascunho/i }).click();
  await expect(page.getByRole("heading", { name: "Simple Past" })).toBeVisible();
  await expect(page.getByText("Adultos iniciantes")).toBeVisible();
  await expect(page.getByText("Warm-up")).toBeVisible();
});

test("mantém o conteúdo dentro da tela no celular", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Contrato específico da navegação móvel.");
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  await expect(page.getByRole("navigation", { name: "Navegação móvel" })).toBeVisible();
});
