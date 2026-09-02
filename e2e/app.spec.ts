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

async function navigateToTool(
  page: Page,
  projectName: string,
  desktopLabel: string,
  mobileLabel: string,
) {
  if (projectName === "mobile") {
    const navigation = page.getByRole("navigation", { name: "Navegação móvel" });
    await navigation.getByRole("button", { name: "Mais", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Mais ferramentas" })
      .getByRole("button", { name: mobileLabel, exact: true })
      .click();
    return;
  }

  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("button", { name: desktopLabel, exact: true })
    .click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("concentra as ferramentas na navegação lateral", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Contrato visual da página inicial desktop.");
  const navigation = page.getByRole("navigation", { name: "Navegação principal" });

  await expect(navigation.getByRole("button")).toHaveCount(8);
  await expect(navigation.getByRole("button", { name: "Espaço do aluno" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("region", { name: "Ferramentas do Espaço do aluno" })).toHaveCount(0);

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
  await expect(page.getByRole("heading", { name: "Mão no vocabulário" })).toBeVisible();
  await expect(page.getByLabel("Folha com moldes de mãos para imprimir")).toBeVisible();
  await expect(page.getByRole("img", { name: /molde de mão/i })).toHaveCount(8);
  await page.getByLabel(/tema da aula/i).fill("Simple Past");
  await page.getByLabel(/perfil da turma/i).fill("Adultos iniciantes");
  await page.getByRole("button", { name: /criar rascunho/i }).click();
  await expect(page.getByRole("heading", { name: "Simple Past" })).toBeVisible();
  await expect(page.getByText("Warm-up")).toBeVisible();
});

test("cria um flashcard e conclui a revisão", async ({ page }, testInfo) => {
  await navigateToTool(page, testInfo.project.name, "Biblioteca", "Biblioteca");
  await page.getByLabel("Frente").fill("Improve");
  await page.getByLabel("Verso").fill("Melhorar");
  await page.getByRole("button", { name: /criar flashcard/i }).click();

  await studentSpaceButton(page, testInfo.project.name).click();
  await page
    .getByRole("navigation", {
      name: testInfo.project.name === "mobile" ? "Navegação móvel" : "Navegação principal",
    })
    .getByRole("button", {
      name: testInfo.project.name === "mobile" ? "Praticar" : "Quizzes e bingo",
      exact: true,
    })
    .click();
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

  await navigation.getByRole("button", { name: "Mais", exact: true }).click();
  const toolsDialog = page.getByRole("dialog", { name: "Mais ferramentas" });
  await expect(toolsDialog).toBeVisible();
  await page.waitForTimeout(350);
  const toolItems = toolsDialog.locator(".more-item");
  await expect(toolItems).toHaveCount(4);

  for (const item of await toolItems.all()) {
    const iconBox = await item.locator(".navigation-icon").boundingBox();
    const glyphBox = await item.locator(".navigation-icon__glyph").boundingBox();
    expect(iconBox).not.toBeNull();
    expect(glyphBox).not.toBeNull();
    expect(iconBox!.width).toBe(32);
    expect(iconBox!.height).toBe(32);
    expect(glyphBox!.width).toBe(20);
    expect(glyphBox!.height).toBe(20);
    expect(glyphBox!.x).toBeGreaterThanOrEqual(iconBox!.x);
    expect(glyphBox!.y).toBeGreaterThanOrEqual(iconBox!.y);
    expect(glyphBox!.x + glyphBox!.width).toBeLessThanOrEqual(iconBox!.x + iconBox!.width);
    expect(glyphBox!.y + glyphBox!.height).toBeLessThanOrEqual(iconBox!.y + iconBox!.height);
  }

  await toolsDialog.getByRole("button", { name: "Fechar menu" }).click();
  await expect(toolsDialog).toBeHidden();

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
  await navigateToTool(page, testInfo.project.name, "Cadernos", "Notas");
  await page.getByRole("button", { name: /nova anotação/i }).click();

  await page.getByRole("button", { name: "Digitalizar" }).click();
  await expect(page.getByRole("dialog", { name: "Digitalizar documento" })).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();

  await page.getByRole("button", { name: "Escrever à mão" }).click();
  await expect(page.getByRole("dialog", { name: "Escrever à mão" })).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();

  await studentSpaceButton(page, testInfo.project.name).click();
  await page
    .getByRole("navigation", {
      name: testInfo.project.name === "mobile" ? "Navegação móvel" : "Navegação principal",
    })
    .getByRole("button", {
      name: testInfo.project.name === "mobile" ? "Praticar" : "Quizzes e bingo",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Bingo", exact: true }).click();
  await page.getByRole("button", { name: "Criar bingo" }).click();
  const board = page.getByRole("group", { name: "Cartela de bingo" });
  const cells = board.getByRole("button");
  await expect(cells).toHaveCount(9);
  for (let index = 0; index < 3; index += 1) await cells.nth(index).click();
  await expect(page.getByRole("status")).toContainText("Bingo");
});
