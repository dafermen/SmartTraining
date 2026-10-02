import { expect, test } from "@playwright/test";

test("redirects protected documentation to login", async ({ page }) => {
  await page.goto("/docs");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible();
});

test("allows a learner to read documentation and close the session", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("learner");
  await page.getByLabel("Contraseña").fill("comillas22");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page).toHaveURL(/\/learn$/);
  await page.goto("/docs");
  await expect(
    page.getByRole("heading", { name: "Documentación SmartTraining" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Manual del participante" }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: /cerrar sesión|salir/i }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("routes an administrator to the administration panel", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("admin");
  await page.getByLabel("Contraseña").fill("comillas22");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.locator('a[href="/admin/users"]:visible').first(),
  ).toBeVisible();
  await expect(
    page.locator('a[href="/admin/content"]:visible').first(),
  ).toBeVisible();
});
