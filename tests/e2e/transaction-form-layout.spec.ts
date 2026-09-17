import { expect, test } from "@playwright/test";

test.use({ browserName: "webkit" });

for (const viewport of [{ width: 820, height: 1180 }, { width: 1180, height: 820 }, { width: 390, height: 844 }]) {
  test(`transaction forms fit at ${viewport.width}px in WebKit`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const headers = { Origin: "http://127.0.0.1:3003" };
    await page.request.post("/app/bff/auth/login", { headers, data: { email: `layout-${viewport.width}@example.test`, password: "integration-only-password" } });
    const initialized = await page.request.post("/app/bff/budgets/initialize", { headers, data: { year: 2026, month: 9 } });
    expect(initialized.ok()).toBe(true);

    for (const [route, kind] of [["expenses", "gasto"], ["incomes", "ingreso"]]) {
      await page.goto(`/app/${route}?period=2026-09`);
      await page.getByRole("button", { name: `+ Registrar ${kind}`, exact: true }).click();
      const form = page.getByRole("form", { name: `Registrar nuevo ${kind}` });
      await expect(form).toBeVisible();
      const formBox = (await form.boundingBox())!;
      const filtersBox = (await page.getByRole("region", { name: "Filtros de movimientos" }).boundingBox())!;
      expect(formBox.y - (filtersBox.y + filtersBox.height)).toBeGreaterThanOrEqual(23);

      for (const control of await form.locator("input, select, textarea").all()) {
        const box = (await control.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(formBox.x);
        expect(box.x + box.width).toBeLessThanOrEqual(formBox.x + formBox.width);
      }
      for (const date of await form.locator('input[type="date"]').all()) {
        const box = (await date.boundingBox())!;
        const field = (await date.locator("..").boundingBox())!;
        expect(box.width).toBeLessThanOrEqual(field.width);
      }
      for (const select of await form.locator("select").all()) {
        expect((await select.boundingBox())!.height).toBe(48);
      }
      const checkbox = form.locator('input[type="checkbox"]').first();
      expect((await checkbox.boundingBox())!.width).toBe(20);
      expect((await checkbox.boundingBox())!.height).toBe(20);
      await checkbox.check();
      await expect(checkbox).toBeChecked();
      await page.screenshot({ path: test.info().outputPath(`${route}-${viewport.width}.png`), fullPage: true });
    }
  });
}
