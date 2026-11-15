import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
);
const base = new URL(
  "/mapa",
  process.env.UI_BASE_URL ?? "http://127.0.0.1:3000",
).href;
const out = fileURLToPath(
  new URL("../docs/capturas/explorador-minimal/", import.meta.url),
);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
async function selectTerritory(page, id) {
  await page.locator("#territory-select").click();
  await page.locator(`[role="option"][data-territory-id="${id}"]`).click();
}
const errors = [];
const checks = [];
const dataRequests = [];
const check = (name) => {
  checks.push(name);
  console.log("OK", name);
};
const desktop = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
desktop.on("pageerror", (e) => errors.push(e.message));
desktop.on("request", (request) => {
  if (request.url().includes("/api/dehecho/")) dataRequests.push(request.url());
});
try {
  await desktop.goto(base, { waitUntil: "domcontentloaded" });
  await desktop.waitForFunction(() =>
    document.querySelector(".trend-magnitude")?.textContent.includes("9.34"),
  );
  await desktop.waitForFunction(
    () => document.querySelector('[data-map-ready="true"]'),
    undefined,
    { timeout: 45000 },
  );
  await desktop.screenshot({
    path: `${out}/region-escritorio.png`,
    fullPage: true,
  });
  check("Región: serie y tendencia reales; mapa 3D cargado");
  assert.equal(await desktop.locator(".chart-data-table tbody tr").count(), 0);
  await desktop.evaluate(() => {
    window.originalPlot = document.querySelector(".line-chart-plot");
  });
  await selectTerritory(desktop, "09101");
  await desktop.waitForFunction(() =>
    document.querySelector(".trend-magnitude")?.textContent.includes("10.21"),
  );
  assert.equal(await desktop.locator("#panel-title").innerText(), "Temuco");
  assert.equal(
    await desktop.evaluate(
      () => window.originalPlot === document.querySelector(".line-chart-plot"),
    ),
    true,
  );
  const beforeComparison = dataRequests.length;
  await desktop
    .getByLabel("Compare with La Araucanía", { exact: true })
    .check();
  await desktop.locator(".chart-legend").waitFor();
  assert.equal(await desktop.locator(".chart-legend button").count(), 2);
  assert.equal(
    dataRequests.length,
    beforeComparison,
    "the comparison reuses the cached regional series",
  );
  await desktop
    .locator(".chart-legend button")
    .filter({ hasText: "Temuco" })
    .click();
  await desktop
    .getByLabel("Compare with La Araucanía", { exact: true })
    .uncheck();
  assert.ok(
    (await desktop.locator(".line-chart-plot svg path[stroke]").count()) > 0,
  );
  await desktop.getByRole("button", { name: "1 year", exact: true }).click();
  await desktop
    .getByRole("button", { name: "View data table", exact: true })
    .click();
  await desktop
    .getByRole("dialog", { name: "Monthly data", exact: true })
    .locator("tbody tr")
    .first()
    .waitFor();
  assert.equal(
    await desktop
      .getByRole("dialog", { name: "Monthly data", exact: true })
      .locator("tbody tr")
      .count(),
    12,
  );
  assert.equal(await desktop.locator(".trend-period").innerText(), "2014–2023");
  await desktop
    .getByRole("dialog", { name: "Monthly data", exact: true })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await desktop.locator(".line-chart-plot").focus();
  await desktop.keyboard.press("Home");
  assert.match(await desktop.locator(".chart-readout").innerText(), /Jan 2023/);
  await desktop.keyboard.press("ArrowRight");
  assert.match(await desktop.locator(".chart-readout").innerText(), /Feb 2023/);
  await desktop.keyboard.press("End");
  assert.match(await desktop.locator(".chart-readout").innerText(), /Dec 2023/);
  check(
    "Temuco: comparación, leyenda, 12 meses y navegación por teclado; tendencia conservada",
  );
  await desktop
    .getByLabel("Compare with La Araucanía", { exact: true })
    .check();
  await desktop.locator(".chart-legend").waitFor();
  await desktop
    .getByRole("button", { name: "Full period", exact: true })
    .click();
  await desktop.locator(".data-column").evaluate((el) => (el.scrollTop = 0));
  await desktop.screenshot({
    path: `${out}/temuco-comparacion.png`,
    fullPage: true,
  });
  await desktop.locator(".fire-details").click();
  await desktop.locator(".association-value").waitFor();
  await desktop
    .getByRole("dialog", {
      name: "Regional wildfire analysis",
      exact: true,
    })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await desktop
    .getByRole("button", { name: "Precipitation", exact: true })
    .click();
  await desktop.locator(".fire-details").click();
  await desktop.waitForFunction(() =>
    document.querySelector(".association-value")?.textContent.includes("1.73"),
  );
  assert.match(
    await desktop.locator(".regional-notice").innerText(),
    /all of La Araucanía/,
  );
  assert.match(
    await desktop.locator(".evidence-badge").innerText(),
    /Insufficient evidence/,
  );
  await desktop
    .getByRole("dialog", {
      name: "Regional wildfire analysis",
      exact: true,
    })
    .screenshot({ path: `${out}/incendios-regionales.png` });
  check(
    "Incendios: razón de tasas regional y hallazgo publicados, sin atribución comunal",
  );
  await desktop
    .getByRole("dialog", {
      name: "Regional wildfire analysis",
      exact: true,
    })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await selectTerritory(desktop, "09116");
  await desktop
    .getByRole("button", { name: "Soil moisture", exact: true })
    .click();
  await desktop.locator(".coverage-state").waitFor();
  assert.match(
    await desktop.locator(".coverage-state").innerText(),
    /Insufficient data coverage/,
  );
  assert.equal(await desktop.locator(".trend-magnitude").count(), 0);
  assert.equal(await desktop.locator(".line-chart-plot").count(), 0);
  await desktop
    .getByRole("button", { name: "Relative humidity", exact: true })
    .click();
  await desktop.locator(".trend-magnitude").waitFor();
  check(
    "Saavedra: suelo sin datos, sin ceros inventados; otras variables disponibles",
  );
  await desktop.locator(".map-stage").focus();
  await desktop.keyboard.press("ArrowRight");
  await desktop.waitForFunction(
    () => document.querySelector("#panel-title")?.textContent === "Temuco",
  );
  check("La selección por teclado del mapa actualiza la ficha");
  let delayed = false;
  let markAngolStarted;
  const angolStarted = new Promise((resolve) => {
    markAngolStarted = resolve;
  });
  await desktop.route("**/api/dehecho/series?*", async (route) => {
    if (
      new URL(route.request().url()).searchParams.get("territory_id") ===
      "09201"
    ) {
      delayed = true;
      markAngolStarted();
      const result = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, 350));
      try {
        await route.fulfill({ response: result });
      } catch {
        // A superseded selection can cancel this intercepted request.
      }
    } else await route.continue();
  });
  await selectTerritory(desktop, "09201");
  await angolStarted;
  assert.equal(
    await desktop.locator("#panel-title").innerText(),
    "Temuco",
    "pending values keep their original territory label",
  );
  assert.equal(await desktop.locator(".panel-data .data-skeleton").count(), 0);
  await selectTerritory(desktop, "09115");
  await desktop.waitForFunction(
    () =>
      document.querySelector("#panel-title")?.textContent === "Pucón" &&
      document.querySelector(".line-chart"),
  );
  await new Promise((resolve) => setTimeout(resolve, 500));
  assert.match(
    await desktop.locator(".line-chart").getAttribute("aria-label"),
    /Pucón/,
  );
  assert.equal(await desktop.locator("#panel-title").innerText(), "Pucón");
  assert.equal(delayed, true);
  await desktop.unroute("**/api/dehecho/series?*");
  check(
    "Selección rápida: una respuesta retrasada no reemplaza los datos de la comuna actual",
  );
  let fail = true;
  await desktop.route("**/api/dehecho/series?*", async (route) => {
    const query = new URL(route.request().url()).searchParams;
    if (fail && query.get("territory_id") === "09115") {
      fail = false;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "dataset_unavailable", message: "No disponible" },
        }),
      });
    } else await route.continue();
  });
  await desktop
    .getByRole("button", { name: "Air temperature", exact: true })
    .click();
  await desktop.locator(".panel-data .data-error").waitFor();
  assert.equal(
    await desktop.locator(".panel-data .chart-data-table").count(),
    0,
  );
  await desktop
    .locator(".panel-data .data-error")
    .getByRole("button", { name: "Try again" })
    .click();
  await desktop.locator(".line-chart").waitFor();
  await desktop.unroute("**/api/dehecho/series?*");
  check(
    "HTTP 503: error visible y reintento recupera la serie sin datos anteriores",
  );
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto(base, { waitUntil: "domcontentloaded" });
  await mobile.locator(".trend-magnitude").waitFor();
  await mobile.waitForFunction(() =>
    document.querySelector('[data-map-ready="true"]'),
  );
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  await selectTerritory(mobile, "09101");
  await mobile.waitForFunction(() =>
    document.querySelector(".trend-magnitude")?.textContent.includes("10.21"),
  );
  await mobile.waitForFunction(() =>
    document.querySelector('[data-map-ready="true"]'),
  );
  await mobile.screenshot({ path: `${out}/temuco-movil.png`, fullPage: true });
  await mobile.setViewportSize({ width: 320, height: 720 });
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  await mobile.setViewportSize({ width: 768, height: 1024 });
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  check(
    "Móvil y tablet: selección y gráfico operativos, sin desbordamiento a 320, 390 y 768 px",
  );
  assert.deepEqual(errors, []);
  check("Sin errores JavaScript en escritorio y móvil");
  await writeFile(
    `${out}/verificacion.json`,
    JSON.stringify(
      { date: new Date().toISOString(), base, checks, errors },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
