import { expect, test, type Page } from "@playwright/test";

function studentSpaceButton(page: Page, projectName: string) {
  const mobile = projectName === "mobile";
  const navigation = page.getByRole("navigation", {
    name: mobile ? "Navegação móvel" : "Navegação principal",
  });

  return navigation.getByRole("button", {
    name: mobile ? "Espaço" : "Espaço do aluno",
    exact: true,
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("centraliza os atalhos, restaura o hover roxo e remove o sol", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Contrato visual da página inicial desktop.");
  const quickActions = page.getByRole("region", { name: "Ferramentas do Espaço do aluno" });
  const icons = quickActions.locator(".quick-action-icon");

  await expect(icons).toHaveCount(5);
  await expect(icons.first()).toHaveCSS("background-color", "rgb(238, 233, 255)");
  await expect(icons.first()).toHaveCSS("color", "rgb(23, 21, 28)");
  await page.waitForTimeout(800);

  for (const icon of await icons.all()) {
    const badgeBox = await icon.boundingBox();
    const glyphBox = await icon.locator(".navigation-icon__glyph").boundingBox();
    expect(badgeBox).not.toBeNull();
    expect(glyphBox).not.toBeNull();
    expect(
      Math.abs(badgeBox!.x + badgeBox!.width / 2 - (glyphBox!.x + glyphBox!.width / 2)),
    ).toBeLessThan(0.6);
    expect(
      Math.abs(badgeBox!.y + badgeBox!.height / 2 - (glyphBox!.y + glyphBox!.height / 2)),
    ).toBeLessThan(0.6);
  }

  await quickActions.getByRole("button", { name: /iniciar foco/i }).hover();
  await expect(icons.first()).toHaveCSS("background-color", "rgb(114, 87, 232)");
  await expect(quickActions.getByRole("button", { name: /iniciar foco/i })).toHaveCSS(
    "background-color",
    "rgb(238, 233, 255)",
  );

  const heroDecoration = await page
    .locator(".view-heading--today")
    .evaluate((element) => getComputedStyle(element, "::before").content);
  expect(heroDecoration).toBe("none");
});

test("organiza uma tarefa e mantém o dado após recarregar", async ({ page }, testInfo) => {
  await expect(page.getByRole("heading", { name: "Espaço do aluno" })).toBeVisible();
  await expect(page.getByAltText(/helena, a gata preta/i)).toHaveAttribute("src", "/helena.svg");

  await page.getByRole("button", { name: "Agenda", exact: true }).click();
  await page.getByLabel(/o que precisa ser feito/i).fill("Revisar Simple Past");
  await page.getByRole("button", { name: /adicionar tarefa/i }).click();
  await studentSpaceButton(page, testInfo.project.name).click();
  await expect(page.getByText("Revisar Simple Past")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Revisar Simple Past")).toBeVisible();
});

test("preserva o criador de planos de aula", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "O atalho mobile fica no Espaço do aluno.");
  await page.getByRole("button", { name: /planos de aula/i }).click();
  await page.getByLabel(/tema da aula/i).fill("Simple Past");
  await page.getByLabel(/perfil da turma/i).fill("Adultos iniciantes");
  await page.getByRole("button", { name: /criar rascunho/i }).click();
  await expect(page.getByRole("heading", { name: "Simple Past" })).toBeVisible();
  await expect(page.getByText("Warm-up")).toBeVisible();
});

test("cria um flashcard e conclui a revisão", async ({ page }, testInfo) => {
  const quickActions = page.getByRole("region", { name: "Ferramentas do Espaço do aluno" });
  await quickActions.getByRole("button", { name: /biblioteca/i }).click();
  await page.getByLabel("Frente").fill("Improve");
  await page.getByLabel("Verso").fill("Melhorar");
  await page.getByRole("button", { name: /criar flashcard/i }).click();

  await studentSpaceButton(page, testInfo.project.name).click();
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

  for (const label of ["Agenda", "Foco", "Praticar", "Espaço"]) {
    await navigation.getByRole("button", { name: label, exact: true }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
  }

  for (const label of ["Hábitos", "Notas", "Biblioteca", "Planos de aula"]) {
    await navigation.getByRole("button", { name: "Mais", exact: true }).click();
    const more = page.getByRole("dialog", { name: "Mais ferramentas" });
    await expect(more).toBeVisible();
    await more.getByRole("button", { name: label, exact: true }).click();
    await expect(more).toBeHidden();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
  }
});

test("abre digitalização, escrita à mão e completa um bingo", async ({ page }, testInfo) => {
  const quickActions = page.getByRole("region", { name: "Ferramentas do Espaço do aluno" });
  await quickActions.getByRole("button", { name: /nova anotação/i }).click();
  await page.getByRole("button", { name: /nova anotação/i }).click();

  await page.getByRole("button", { name: "Digitalizar" }).click();
  await expect(page.getByRole("dialog", { name: "Digitalizar documento" })).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();

  await page.getByRole("button", { name: "Escrever à mão" }).click();
  await expect(page.getByRole("dialog", { name: "Escrever à mão" })).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();

  await studentSpaceButton(page, testInfo.project.name).click();
  await quickActions.getByRole("button", { name: /quizzes e bingo/i }).click();
  await page.getByRole("button", { name: "Bingo", exact: true }).click();
  await page.getByRole("button", { name: "Criar bingo" }).click();
  const board = page.getByRole("group", { name: "Cartela de bingo" });
  const cells = board.getByRole("button");
  await expect(cells).toHaveCount(9);
  for (let index = 0; index < 3; index += 1) await cells.nth(index).click();
  await expect(page.getByRole("status")).toContainText("Bingo");
});
