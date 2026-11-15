import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  decodeSeries,
  decodeTrends,
  decodeCatalog,
} from "../src/features/environment/infrastructure/decoders.ts";
import { createHttpEnvironmentRepository } from "../src/features/environment/infrastructure/http-repository.ts";
import { environmentalChartData } from "../src/features/environment/application/chart-data.ts";
import {
  chartGeometry,
  linePath,
} from "../src/components/charts/line-chart/model.ts";
import { formatMonth } from "../src/features/environment/domain/environment.ts";
import { proxyDehecho } from "../src/server/dehecho-proxy.ts";

const snapshot = JSON.parse(
  await readFile(
    new URL("../docs/ux/api-respuestas-inspeccionadas.json", import.meta.url),
    "utf8",
  ),
);
const response = (name) =>
  structuredClone(snapshot.responses.find((entry) => entry.name === name).body);

test("the real API contract preserves territory codes, missing coverage and zero observations", () => {
  assert.equal(
    decodeCatalog(response("catalogo")).find(
      (row) => row.id === "ambiente_comunas",
    ).territories.length,
    32,
  );
  const data = response("suelo_saavedra");
  data[0].points.push({ start: "2023-02-01", end: "2023-02-28", value: 0 });
  const [series] = decodeSeries(data);
  assert.equal(series.territoryId, "09116");
  assert.equal(series.points[0].value, null);
  assert.equal(series.points[0].missingReason, "insufficient_coverage");
  assert.equal(series.points[1].value, 0);
});

test("published evidence is kept even when a marginal interval does not cross zero", () => {
  const rain = decodeTrends(response("tendencias_region")).find(
    (row) => row.variable === "precipitation_mm",
  );
  assert.ok(rain.high < 0);
  assert.equal(rain.status, "uncertain_trend");
  assert.ok(rain.pHolm > 0.05);
});

test("invalid numbers, incompatible frequencies and unknown trend statuses fail at the boundary", () => {
  const bad = response("serie_temuco");
  bad[0].points[0].value = "18.901";
  assert.throws(() => decodeSeries(bad));
  bad[0].frequency = "season";
  assert.throws(() => decodeSeries(bad));
  const trend = response("tendencias_temuco");
  trend[0].status = "no_change";
  assert.throws(() => decodeTrends(trend));
});

test("comparison aligns calendar months without replacing missing observations with zero", () => {
  const [primary] = decodeSeries(response("serie_temuco"));
  const comparison = {
    ...primary,
    territoryId: "09",
    points: [primary.points[2], primary.points[0]],
  };
  const model = environmentalChartData(
    primary,
    comparison,
    "all",
    "Temuco",
    "#287c70",
  );
  assert.deepEqual(model.series[1].values, [18.378, null, 16.206]);
  assert.equal(model.series[1].dashed, true);
});

test("a one-year chart window uses calendar time and leaves the source and trend untouched", () => {
  const [primary] = decodeSeries(response("serie_temuco"));
  primary.points.unshift({ start: "2020-01-01", end: "2020-01-31", value: 12 });
  const model = environmentalChartData(
    primary,
    null,
    "12",
    "Temuco",
    "#287c70",
  );
  assert.equal(model.categories[0], "2023-01-01");
  assert.equal(primary.points.length, 4);
  assert.match(formatMonth("2023-01-01"), /2023/);
  assert.doesNotMatch(formatMonth("2023-01-01"), /2022/);
});

test("line and area geometry leave gaps at nulls, preserve zeros and handle constant series", () => {
  const row = {
    id: "x",
    label: "x",
    color: "green",
    values: [0, 1, null, 2, 2],
  };
  const geometry = chartGeometry([row], 5, 400);
  assert.deepEqual(
    geometry
      .segments(row)
      .map((segment) => segment.map((point) => point.index)),
    [
      [0, 1],
      [3, 4],
    ],
  );
  for (const segment of geometry.segments(row))
    assert.doesNotMatch(linePath(segment), /NaN|Infinity/);
  assert.ok(
    Number.isFinite(chartGeometry([{ ...row, values: [0, 0] }], 2, 400).y(0)),
  );
});

test("repository uses the commune dataset, keeps dates away from trends and scopes fire analysis to the region", async () => {
  const calls = [];
  const repository = createHttpEnvironmentRepository(async (url) => {
    const parsed = new URL(url, "http://localhost");
    calls.push(parsed);
    const body = parsed.pathname.endsWith("/series")
      ? response("serie_temuco")
      : parsed.pathname.endsWith("/tendencias")
        ? response("tendencias_temuco")
        : parsed.pathname.endsWith("/asociaciones")
          ? response("asociaciones")
          : response("hallazgos");
    return Response.json(body);
  });
  const signal = new AbortController().signal;
  const selection = { territoryId: "09101", variable: "temperature_2m_c" };
  assert.equal(
    (await repository.series(selection, signal)).territoryId,
    "09101",
  );
  assert.equal(calls[0].searchParams.get("dataset"), "ambiente_comunas");
  await repository.trend(selection, signal);
  assert.equal(calls[1].searchParams.has("start"), false);
  await repository.fireContext(selection.variable, signal);
  assert.ok(
    calls
      .slice(2)
      .every((url) => url.searchParams.get("territory_id") === "09"),
  );
});

test("proxy rejects arbitrary resources, unsupported dates and duplicate selectors before fetching", async () => {
  const neverFetch = () => {
    throw new Error("must not fetch");
  };
  const base = "http://127.0.0.1:8000";
  assert.equal(
    (
      await proxyDehecho(
        new Request("http://localhost/api"),
        "../private",
        base,
        neverFetch,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await proxyDehecho(
        new Request("http://localhost/api?start=2020-01-01"),
        "tendencias",
        base,
        neverFetch,
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await proxyDehecho(
        new Request("http://localhost/api?dataset=a&dataset=b"),
        "series",
        base,
        neverFetch,
      )
    ).status,
    422,
  );
});

test("proxy preserves unavailable-dataset errors and handles service outages", async () => {
  const request = new Request("http://localhost/api?dataset=ambiente_region");
  const upstreamError = {
    error: { code: "dataset_stale", message: "No disponible" },
  };
  const result = await proxyDehecho(
    request,
    "series",
    "http://127.0.0.1:8000",
    async (url) => {
      assert.equal(
        url.toString(),
        "http://127.0.0.1:8000/api/series?dataset=ambiente_region",
      );
      return Response.json(upstreamError, { status: 503 });
    },
  );
  assert.equal(result.status, 503);
  assert.deepEqual(await result.json(), upstreamError);
  const offline = await proxyDehecho(
    request,
    "series",
    "http://127.0.0.1:8000",
    async () => {
      throw new TypeError("offline");
    },
  );
  assert.equal(offline.status, 502);
});
