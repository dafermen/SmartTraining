import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:5175";
const password = process.env.SCREENSHOT_DEMO_PASSWORD ?? "comillas22";
const outputDirectory = resolve("docs", "assets");

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });

const login = async (page, username, destination) => {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Usuario").fill(username);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(new RegExp(`${destination}$`));
  await page.emulateMedia({ reducedMotion: "reduce" });
};

try {
  const desktop = await browser.newContext({
    locale: "es-CO",
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1,
  });
  const adminPage = await desktop.newPage();
  await login(adminPage, "admin", "/admin");
  await adminPage.getByRole("heading", { name: /bienvenido/i }).waitFor();
  await adminPage.screenshot({
    path: resolve(outputDirectory, "admin-dashboard.png"),
    fullPage: true,
    animations: "disabled",
  });

  await adminPage.goto(`${baseUrl}/admin/assignments`, {
    waitUntil: "networkidle",
  });
  await adminPage.getByRole("heading", { name: "Asignaciones" }).waitFor();
  await adminPage.screenshot({
    path: resolve(outputDirectory, "admin-assignments.png"),
    fullPage: true,
    animations: "disabled",
  });
  await desktop.close();

  const learnerDesktop = await browser.newContext({
    locale: "es-CO",
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1,
  });
  const learnerPage = await learnerDesktop.newPage();
  await login(learnerPage, "learner", "/learn");
  await learnerPage
    .getByRole("heading", { name: "Mis capacitaciones" })
    .waitFor();
  await learnerPage
    .getByText("Cargando catálogo…")
    .waitFor({ state: "hidden" });
  await learnerPage.screenshot({
    path: resolve(outputDirectory, "learner-catalog.png"),
    fullPage: true,
    animations: "disabled",
  });
  await learnerDesktop.close();

  const learnerMobile = await browser.newContext({
    locale: "es-CO",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await learnerMobile.newPage();
  await login(mobilePage, "learner", "/learn");
  await mobilePage
    .getByRole("heading", { name: "Mis capacitaciones" })
    .waitFor();
  await mobilePage.getByText("Cargando catálogo…").waitFor({ state: "hidden" });
  await mobilePage.screenshot({
    path: resolve(outputDirectory, "learner-mobile.png"),
    fullPage: true,
    animations: "disabled",
  });
  await learnerMobile.close();
} finally {
  await browser.close();
}

console.log(`Screenshots written to ${outputDirectory}`);
