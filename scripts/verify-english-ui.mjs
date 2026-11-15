import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { formatMonth, formatNumber, formatUnit } from "../src/features/environment/domain/environment.ts";
import { formatWildfireCount } from "../src/features/environment/domain/wildfires.ts";
import { englishFinding } from "../src/features/environment/application/english-findings.ts";

const snapshot = JSON.parse(await readFile(new URL("../docs/ux/api-respuestas-inspeccionadas.json", import.meta.url), "utf8"));
const findings = snapshot.responses.find((row) => row.name === "hallazgos").body;
const numbers = (text) => text.match(/\d+(?:\.\d+)?(?:e[+-]?\d+)?/g) ?? [];

test("English dates keep calendar months in UTC and units preserve scientific scale", () => {
  assert.equal(formatMonth("2023-01-01"), "Jan 2023");
  assert.equal(formatMonth("2023-12-01", true), "December 2023");
  assert.equal(formatNumber(1234.56), "1,234.56");
  assert.equal(formatUnit("mm/mes por década"), "mm/month per decade");
  assert.equal(formatUnit("puntos porcentuales/década"), "percentage points per decade");
  assert.equal(formatUnit("kg/m²/década"), "kg/m² per decade");
  assert.equal(formatWildfireCount(1), "1 wildfire");
  assert.equal(formatWildfireCount(0), "0 wildfires");
  assert.equal(formatWildfireCount(1234), "1,234 wildfires");
});

test("all published findings have English summaries with the actual numeric values and scientific caveats", () => {
  const original = structuredClone(findings);
  for (const finding of findings) {
    const translated = englishFinding(finding);
    assert.equal(translated.id, finding.id);
    assert.doesNotMatch(translated.summary, /not yet available/);
    assert.deepEqual(numbers(translated.summary), numbers(finding.summary));
    assert.match(translated.summary, finding.id === "conaf:monthly_presence" ? /not ignition locations or burned area/ : /do not establish causality or provide forecasts/);
  }
  assert.match(englishFinding(findings.find((row) => row.id === "conaf:heat")).summary, /does not demonstrate the absence of a relationship/);
  assert.match(englishFinding(findings.find((row) => row.id === "conaf:soil_deficit")).summary, /no longer sufficient after adjusting for each year separately/);
  assert.deepEqual(findings, original);
});

test("updated quantities and model-sensitivity statements are translated from the response instead of a stale snapshot", () => {
  const rain = structuredClone(findings.find((row) => row.id === "conaf:rain_deficit"));
  rain.summary = rain.summary.replace("49.60", "61.25").replace("1.73", "2.15").replace("Conserva signo y evidencia en todas las variantes examinadas.", "La evidencia no es estable entre todas las variantes examinadas.");
  const translated = englishFinding(rain);
  assert.match(translated.summary, /61\.25 mm\/month/);
  assert.match(translated.summary, /rate ratio of 2\.15/);
  assert.match(translated.summary, /not consistent across all model variants examined/);
  assert.doesNotMatch(translated.summary, /49\.60|1\.73/);

  const heat = structuredClone(findings.find((row) => row.id === "conaf:heat"));
  heat.title = "Temperatura más alta: asociación ajustada";
  heat.summary = "Un aumento de 1.25 °C en la anomalía mensual se asocia con una razón de tasas de 1.08, condicionado al modelo. Asociación explicativa regional, no causalidad ni pronóstico.";
  assert.match(englishFinding(heat).summary, /An increase of 1\.25 °C/);
});

test("unrecognized source text shows an English notice rather than an invented translation", () => {
  const changed = { ...findings[0], summary: "El texto publicado cambió y debe revisarse." };
  assert.match(englishFinding(changed).summary, /English summary is not yet available/);
  assert.doesNotMatch(englishFinding(changed).summary, /p=|ratio of/);
});
