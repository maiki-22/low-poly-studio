import {
  REGION_ID,
  VARIABLES,
  type VariableId,
} from "../domain/environment.ts";
import type { ChartRange } from "./chart-data.ts";

export type ExplorerSelection = {
  territoryId: string;
  variable: VariableId;
  range: ChartRange;
  compare: boolean;
};
export const DEFAULT_SELECTION: ExplorerSelection = {
  territoryId: REGION_ID,
  variable: "relative_humidity_2m_pct",
  range: "all",
  compare: false,
};

export function parseExplorerSelection(
  search: string,
  territoryIds: ReadonlySet<string>,
): ExplorerSelection {
  const query = new URLSearchParams(search);
  const territory = query.get("territorio") ?? REGION_ID;
  const variable = query.get("variable") ?? DEFAULT_SELECTION.variable;
  const range = query.get("rango");
  return {
    territoryId:
      territory === REGION_ID || territoryIds.has(territory)
        ? territory
        : REGION_ID,
    variable: Object.hasOwn(VARIABLES, variable)
      ? (variable as VariableId)
      : DEFAULT_SELECTION.variable,
    range: range === "12" || range === "60" ? range : "all",
    compare: query.get("comparar") === "1",
  };
}

export function writeExplorerSelection(
  search: string,
  selection: ExplorerSelection,
): string {
  const query = new URLSearchParams(search);
  for (const [key, value, fallback] of [
    ["territorio", selection.territoryId, REGION_ID],
    ["variable", selection.variable, DEFAULT_SELECTION.variable],
    ["rango", selection.range, "all"],
    ["comparar", selection.compare ? "1" : "0", "0"],
  ]) {
    if (value === fallback) query.delete(key);
    else query.set(key, value);
  }
  return query.toString();
}
