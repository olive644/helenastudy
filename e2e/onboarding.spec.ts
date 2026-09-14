import { expect, test } from "@playwright/test";

test("percorre as cinco poses e revisa respostas sem iniciar login", async ({ page }) => {
  await page.goto("/?onboarding=1");
  for (let step = 1; step <= 5; step++) {
    const image = page.locator(".onboarding__helena");
    await expect(image).toHaveAttribute("src", new RegExp(`step-${step}`));
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Entrar com Google" })).toBeVisible();
  await expect(page.locator(".onboarding__summary li")).toHaveCount(5);
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page.getByRole("radio").first()).toBeChecked();
});
