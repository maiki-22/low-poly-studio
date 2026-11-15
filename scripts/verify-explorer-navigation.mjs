import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_SELECTION,
  parseExplorerSelection,
  writeExplorerSelection,
} from "../src/features/environment/application/explorer-navigation.ts";

const territories = new Set(["09101", "09116"]);
test("deep links retain territory codes, variable, chart range and comparison", () => {
  assert.deepEqual(
    parseExplorerSelection(
      "?territorio=09101&variable=temperature_2m_c&rango=12&comparar=1",
      territories,
    ),
    {
      territoryId: "09101",
      variable: "temperature_2m_c",
      range: "12",
      compare: true,
    },
  );
});
test("invalid deep-link selectors fall back to compatible public defaults", () => {
  assert.deepEqual(
    parseExplorerSelection(
      "?territorio=9116&variable=made_up&rango=day&comparar=yes",
      territories,
    ),
    DEFAULT_SELECTION,
  );
});
test("URL writes preserve unrelated parameters and omit default filters", () => {
  const query = writeExplorerSelection(
    "?fuente=demo&territorio=09101&rango=12",
    DEFAULT_SELECTION,
  );
  assert.equal(query, "fuente=demo");
  assert.deepEqual(
    parseExplorerSelection(
      writeExplorerSelection(query, {
        ...DEFAULT_SELECTION,
        territoryId: "09116",
        compare: true,
      }),
      territories,
    ),
    {
      ...DEFAULT_SELECTION,
      territoryId: "09116",
      compare: true,
    },
  );
});
