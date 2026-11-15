import assert from "node:assert/strict";
import { createHttpEnvironmentRepository } from "../src/features/environment/infrastructure/http-repository.ts";
import { decodeWildfires, seasonCount } from "../src/features/environment/domain/wildfires.ts";

const base = process.env.UI_BASE_URL ?? "http://127.0.0.1:3000";
const repository = createHttpEnvironmentRepository((path, options) => fetch(new URL(path, base), options));
const signal = AbortSignal.timeout(30_000);
const selection = { territoryId: "09101", variable: "relative_humidity_2m_pct" };
const [catalog, series, trend, fireContext, fireResponse] = await Promise.all([
  repository.catalog(signal), repository.series(selection, signal), repository.trend(selection, signal),
  repository.fireContext(selection.variable, signal), fetch(new URL("/api/incendios", base), { signal }),
]);
assert.ok(catalog.filter((row) => row.available).length >= 5);
assert.equal(series?.territoryId, "09101");
assert.equal(series?.points.length, 120);
assert.equal(trend?.territoryId, "09101");
assert.ok(fireContext.association);
assert.ok(fireContext.findings.length);
assert.ok(fireResponse.ok);
const fires = decodeWildfires(await fireResponse.json());
assert.equal(fires.seasons.length, 10);
assert.ok(seasonCount(fires.seasons[0], "09") > 0);
console.log("Live API verified: catalog, 120 monthly observations for Temuco, trend, regional associations/findings and 10 CONAF seasons.");
