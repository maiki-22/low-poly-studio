export const VARIABLES = {
  relative_humidity_2m_pct: {
    label: "Humedad del aire",
    shortLabel: "Aire",
    definition: "Humedad relativa del aire a 2 metros de altura.",
    unit: "%",
    trendUnit: "pp por década",
    color: "#287c70",
    symbol: "humidity",
  },
  temperature_2m_c: {
    label: "Temperatura",
    shortLabel: "Temperatura",
    definition: "Temperatura media del aire a 2 metros de altura.",
    unit: "°C",
    trendUnit: "°C por década",
    color: "#a45b39",
    symbol: "temperature",
  },
  precipitation_mm: {
    label: "Precipitación",
    shortLabel: "Lluvia",
    definition: "Precipitación acumulada durante cada mes.",
    unit: "mm/mes",
    trendUnit: "mm/mes por década",
    color: "#377b9f",
    symbol: "rain",
  },
  soil_moisture_0_10cm_kgm2: {
    label: "Humedad del suelo",
    shortLabel: "Suelo",
    definition:
      "Agua contenida en la capa superficial del suelo, de 0 a 10 centímetros.",
    unit: "kg/m²",
    trendUnit: "kg/m² por década",
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
  evidence_increasing: "Aumento con evidencia",
  evidence_decreasing: "Descenso con evidencia",
  uncertain_trend: "Evidencia insuficiente",
  insufficient_coverage: "Cobertura insuficiente",
};

const numberFormatters = new Map<number, Intl.NumberFormat>();
const monthFormatters = {
  short: new Intl.DateTimeFormat("es-CL", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }),
  long: new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }),
};

export function formatNumber(value: number, decimals = 2): string {
  let formatter = numberFormatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat("es-CL", {
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
    .format(new Date(`${value.slice(0, 7)}-01T00:00:00Z`))
    .replace(" de ", " ");
}

export function periodLabel(start: string, end: string): string {
  return `${start.slice(0, 4)}–${end.slice(0, 4)}`;
}
