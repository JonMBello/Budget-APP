import { expect, test } from "@playwright/test";

test.use({ browserName: "webkit" });

for (const width of [320, 390, 430]) {
  test(`month actions share a row on mobile at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const headers = { Origin: "http://127.0.0.1:3003" };
    await page.request.post("/app/bff/auth/login", { headers, data: { email: `period-layout-${width}@example.test`, password: "integration-only-password" } });
    const initialized = await page.request.post("/app/bff/budgets/initialize", { headers, data: { year: 2026, month: 10 } });
    expect(initialized.ok()).toBe(true);
    await page.goto("/app?period=2026-10");
    const create = page.getByRole("button", { name: "+ Nuevo mes", exact: true });
    const close = page.getByRole("button", { name: "Cerrar mes", exact: true });
    await expect(close).toBeVisible();
    const createBox = (await create.boundingBox())!;
    const closeBox = (await close.boundingBox())!;
    const selectBox = (await page.getByLabel("Seleccionar mes activo").boundingBox())!;
    expect(createBox.y).toBe(closeBox.y);
    expect(createBox.height).toBe(closeBox.height);
    expect(closeBox.x).toBeGreaterThan(createBox.x + createBox.width);
    expect(selectBox.y + selectBox.height).toBeLessThan(createBox.y);
    expect(closeBox.x + closeBox.width).toBeLessThanOrEqual(width);
    await close.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await create.click();
    await expect(page.getByRole("heading", { name: "Abrir periodo presupuestario" })).toBeVisible();
  });
}
