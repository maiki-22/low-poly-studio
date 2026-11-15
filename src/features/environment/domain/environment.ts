import { UI_LOCALE } from "../../../lib/locale.ts";

export const VARIABLES = {
  relative_humidity_2m_pct: {
    label: "Relative humidity",
    shortLabel: "Humidity",
    definition: "Relative humidity of the air at 2 meters above the ground.",
    unit: "%",
    trendUnit: "percentage points per decade",
    color: "#287c70",
    symbol: "humidity",
  },
  temperature_2m_c: {
    label: "Air temperature",
    shortLabel: "Temperature",
    definition: "Mean air temperature at 2 meters above the ground.",
    unit: "°C",
    trendUnit: "°C per decade",
    color: "#a45b39",
    symbol: "temperature",
  },
  precipitation_mm: {
    label: "Precipitation",
    shortLabel: "Precipitation",
    definition: "Total precipitation accumulated during each month.",
    unit: "mm/month",
    trendUnit: "mm/month per decade",
    color: "#377b9f",
    symbol: "rain",
  },
  soil_moisture_0_10cm_kgm2: {
    label: "Soil moisture",
    shortLabel: "Soil",
    definition:
      "Water content in the top 10 centimeters of soil.",
    unit: "kg/m²",
    trendUnit: "kg/m² per decade",
    color: "#867045",
    symbol: "soil",
  },
} as const;

export type VariableId = keyof typeof VARIABLES;
export const VARIABLE_IDS = Object.keys(VARIABLES) as VariableId[];
export const REGION_ID = "09";
export type TrendStatus =
  | "evidence_increasing"
  | "evidence_decreasing"
  | "uncertain_trend"
  | "insufficient_coverage";
export type Dataset = {
  id: string;
  available: boolean;
  variables: string[];
  territories: string[];
};
export type MonthlyPoint = {
  start: string;
  end: string;
  value: number | null;
  missingReason?: string;
};
export type EnvironmentalSeries = {
  variable: VariableId;
  territoryId: string;
  unit: string;
  points: MonthlyPoint[];
};
export type EnvironmentalTrend = {
  variable: VariableId;
  territoryId: string;
  periodStart: string;
  periodEnd: string;
  unit: string;
  slope: number | null;
  low: number | null;
  high: number | null;
  pHolm: number | null;
  status: TrendStatus;
  nUsed: number;
};
export type FireAssociation = {
  variable: VariableId;
  ratio: number | null;
  increment: number;
  direction: "increase" | "decrease";
  unit: string;
  low: number | null;
  high: number | null;
  pHolm: number | null;
  periodStart: string;
  periodEnd: string;
};
export type Finding = { id: string; title: string; summary: string };
export type SeriesSelection = { variable: VariableId; territoryId: string };

/** The feature depends on this contract, independently of HTTP or a future data source. */
export interface EnvironmentRepository {
  catalog(signal: AbortSignal): Promise<Dataset[]>;
  series(
    selection: SeriesSelection,
    signal: AbortSignal,
  ): Promise<EnvironmentalSeries | null>;
  trend(
    selection: SeriesSelection,
    signal: AbortSignal,
  ): Promise<EnvironmentalTrend | null>;
  fireContext(
    variable: VariableId,
    signal: AbortSignal,
  ): Promise<{ association: FireAssociation | null; findings: Finding[] }>;
}

export const TREND_LABELS: Record<TrendStatus, string> = {
  evidence_increasing: "Evidence of an increase",
  evidence_decreasing: "Evidence of a decrease",
  uncertain_trend: "Insufficient evidence",
  insufficient_coverage: "Insufficient coverage",
};

const numberFormatters = new Map<number, Intl.NumberFormat>();
const monthFormatters = {
  short: new Intl.DateTimeFormat(UI_LOCALE, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }),
  long: new Intl.DateTimeFormat(UI_LOCALE, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }),
};

export function formatNumber(value: number, decimals = 2): string {
  let formatter = numberFormatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat(UI_LOCALE, {
      maximumFractionDigits: decimals,
    });
    numberFormatters.set(decimals, formatter);
  }
  return formatter.format(value);
}

export function formatSigned(value: number): string {
  return `${value < 0 ? "−" : value > 0 ? "+" : ""}${formatNumber(Math.abs(value))}`;
}

export function formatMonth(value: string, long = false): string {
  return monthFormatters[long ? "long" : "short"]
    .format(new Date(`${value.slice(0, 7)}-01T00:00:00Z`));
}

/** Translate display units without changing the upstream scientific data. */
export function formatUnit(unit: string): string {
  return unit
    .replaceAll("puntos porcentuales", "percentage points")
    .replaceAll("pp por década", "percentage points per decade")
    .replaceAll("por década", "per decade")
    .replaceAll("/década", " per decade")
    .replaceAll("/mes", "/month");
}

export function periodLabel(start: string, end: string): string {
  return `${start.slice(0, 4)}–${end.slice(0, 4)}`;
}
