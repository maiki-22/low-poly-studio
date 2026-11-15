import {
  VARIABLE_IDS,
  type Dataset,
  type EnvironmentalSeries,
  type EnvironmentalTrend,
  type Finding,
  type FireAssociation,
  type TrendStatus,
  type VariableId,
} from "../domain/environment.ts";

type Row = Record<string, unknown>;
const invalid = () =>
  new Error("La respuesta de datos no tiene el formato esperado.");
function record(value: unknown): Row {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw invalid();
  return value as Row;
}
function rows(value: unknown): Row[] {
  if (!Array.isArray(value)) throw invalid();
  return value.map(record);
}
function string(value: unknown): string {
  if (typeof value !== "string") throw invalid();
  return value;
}
function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw invalid();
  return value;
}
function nullable(value: unknown): number | null {
  return value === null ? null : number(value);
}
function strings(value: unknown): string[] {
  if (!Array.isArray(value)) throw invalid();
  return value.map(string);
}
function date(value: unknown): string {
  const text = string(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text)))
    throw invalid();
  return text;
}
function variable(value: unknown): VariableId {
  if (!VARIABLE_IDS.includes(value as VariableId)) throw invalid();
  return value as VariableId;
}
const STATUSES: TrendStatus[] = [
  "evidence_increasing",
  "evidence_decreasing",
  "uncertain_trend",
  "insufficient_coverage",
];

export function decodeCatalog(value: unknown): Dataset[] {
  return rows(value).map((row) => {
    if (typeof row.available !== "boolean") throw invalid();
    return {
      id: string(row.id),
      available: row.available,
      variables: strings(row.variables),
      territories: strings(row.territories),
    };
  });
}

export function decodeSeries(value: unknown): EnvironmentalSeries[] {
  return rows(value).map((row) => {
    if (row.frequency !== "month") throw invalid();
    return {
      variable: variable(row.variable),
      territoryId: string(row.territory_id),
      unit: string(row.unit),
      points: rows(row.points)
        .map((point) => ({
          start: date(point.start),
          end: date(point.end),
          value: nullable(point.value),
          ...(point.missing_reason == null
            ? {}
            : { missingReason: string(point.missing_reason) }),
        }))
        .sort((a, b) => a.start.localeCompare(b.start)),
    };
  });
}

export function decodeTrends(value: unknown): EnvironmentalTrend[] {
  return rows(value).map((row) => {
    if (!STATUSES.includes(row.status as TrendStatus)) throw invalid();
    const nUsed = number(row.n_used);
    if (!Number.isInteger(nUsed) || nUsed < 0) throw invalid();
    return {
      variable: variable(row.variable),
      territoryId: string(row.territory_id),
      periodStart: date(row.period_start),
      periodEnd: date(row.period_end),
      unit: string(row.unit),
      slope: nullable(row.slope_per_decade),
      low: nullable(row.ci95_marginal_low),
      high: nullable(row.ci95_marginal_high),
      pHolm: nullable(row.p_holm),
      status: row.status as TrendStatus,
      nUsed,
    };
  });
}

export function decodeAssociations(value: unknown): FireAssociation[] {
  return rows(value).map((row) => {
    if (
      row.type !== "rate_ratio" ||
      row.territory_id !== "09" ||
      !["increase", "decrease"].includes(string(row.direction))
    )
      throw invalid();
    return {
      variable: variable(row.variable),
      ratio: nullable(row.rate_ratio),
      increment: number(row.increment),
      direction: row.direction as "increase" | "decrease",
      unit: string(row.unit),
      low: row.ci95_marginal_low == null ? null : number(row.ci95_marginal_low),
      high:
        row.ci95_marginal_high == null ? null : number(row.ci95_marginal_high),
      pHolm: row.p_holm == null ? null : number(row.p_holm),
      periodStart: date(row.period_start),
      periodEnd: date(row.period_end),
    };
  });
}

export function decodeFindings(value: unknown): Finding[] {
  return rows(value).map((row) => ({
    id: string(row.id),
    title: string(row.title),
    summary: string(row.summary),
  }));
}
