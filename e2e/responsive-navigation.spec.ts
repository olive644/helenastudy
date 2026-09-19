import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("helena.onboarding.v1", JSON.stringify({ completed: true }));
    localStorage.setItem("helenastudy.theme", "light");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const width of [320, 360, 390, 768, 1280]) {
  test(`navegação e foco sem recortes em ${width}px`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop",
      "Larguras verificadas explicitamente com Chromium.",
    );
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const mobile = width < 900;
    const navigation = page.getByRole("navigation", {
      name: mobile ? "Navegação móvel" : "Navegação principal",
    });
    const profile = page.locator(".page-header .user-profile");
    await expect(profile).toBeVisible();
    await expect(profile).toHaveCSS("border-radius", "50%");
    if (mobile) {
      const more = page.getByRole("button", { name: "Mais", exact: true });
      await expect(more).toBeVisible();
      const profileTab = navigation.getByRole("button", { name: "Perfil, em breve" });
      await expect(profileTab).toBeDisabled();
      await expect(profileTab.locator("img")).toHaveAttribute(
        "src",
        "/navigation-icons/paper/profile.svg",
      );
      await more.click();
      await expect(page.getByRole("dialog", { name: "Mais ferramentas" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(more).toBeFocused();
      await navigation.getByRole("button", { name: "Praticar", exact: true }).click();
      await expect(navigation.locator(".mobile-nav__item--featured .mobile-nav__icon")).toHaveCSS(
        "background-color",
        "rgb(116, 51, 224)",
      );
      await expect(
        navigation.locator(".mobile-nav__item--featured .navigation-icon__variant--escuro"),
      ).toBeVisible();
    }
    await navigation.getByRole("button", { name: "Foco", exact: true }).click();
    for (const mode of ["Cronômetro", "Pomodoro"]) {
      await expect(page.locator(".focus-mode-name")).toHaveText(mode);
      if (mode === "Pomodoro") {
        const apples = page.locator(".streak-apple");
        await expect(apples).toHaveCount(7);
        const week = await page.locator(".pomodoro-week").boundingBox();
        for (const apple of await apples.all()) {
          const box = await apple.boundingBox();
          expect(box!.width).toBeGreaterThan(20);
          expect(box!.x).toBeGreaterThanOrEqual(week!.x);
          expect(box!.x + box!.width).toBeLessThanOrEqual(week!.x + week!.width + 1);
        }
      }
      const finish = page.getByRole("button", { name: "Encerrar e registrar" });
      await finish.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const finishBox = await finish.boundingBox();
      const viewportBox = await page.locator(".focus-mode-viewport").boundingBox();
      expect(finishBox!.y + finishBox!.height + 4).toBeLessThanOrEqual(
        viewportBox!.y + viewportBox!.height,
      );
      if (mobile) {
        const navBox = await navigation.boundingBox();
        expect(finishBox!.y + finishBox!.height + 4).toBeLessThan(navBox!.y);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: testInfo.outputPath(`${mode}-${width}-light.png`),
        fullPage: true,
      });
      if (mode === "Cronômetro") await page.getByRole("button", { name: "Próximo modo" }).click();
    }
    await page.locator(".appearance-picker__trigger").click();
    await page.getByRole("button", { name: "Escuro", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.screenshot({
      path: testInfo.outputPath(`Pomodoro-${width}-dark.png`),
      fullPage: true,
    });
  });
}
