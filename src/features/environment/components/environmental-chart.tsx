"use client";

import { memo, useCallback, useMemo } from "react";
import { LineChart } from "@/components/charts/line-chart";
import {
  environmentalChartData,
  type ChartRange,
} from "../application/chart-data";
import {
  formatMonth,
  formatNumber,
  VARIABLES,
  type EnvironmentalSeries,
} from "../domain/environment";

export const EnvironmentalChart = memo(function EnvironmentalChart({
  series,
  comparison,
  territoryName,
  range,
  onRangeChange,
}: {
  series: EnvironmentalSeries;
  comparison: EnvironmentalSeries | null;
  territoryName: string;
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
}) {
  const variable = VARIABLES[series.variable];
  const chartColor = {
    relative_humidity_2m_pct: "#c4dfa1",
    temperature_2m_c: "#f0bf9a",
    precipitation_mm: "#a6d5e8",
    soil_moisture_0_10cm_kgm2: "#e5ce9c",
  }[series.variable];
  const data = useMemo(
    () =>
      environmentalChartData(
        series,
        comparison,
        range,
        territoryName,
        chartColor,
      ),
    [series, comparison, range, territoryName, chartColor],
  );
  const formatValue = useCallback(
    (value: number) => `${formatNumber(value)} ${series.unit}`,
    [series.unit],
  );
  const hasData = series.points.some((point) => point.value !== null);
  return (
    <section className="environmental-chart" aria-label="Serie mensual">
      <div className="chart-heading">
        <h3>Serie mensual</h3>
        <div className="range-controls" aria-label="Rango visible del gráfico">
          {(
            [
              ["all", "Todo el período"],
              ["60", "5 años"],
              ["12", "1 año"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => onRangeChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {hasData ? (
        <LineChart
          {...data}
          domain={
            series.variable === "relative_humidity_2m_pct"
              ? [0, 100]
              : undefined
          }
          label={`${variable.label} en ${territoryName}`}
          formatCategory={formatMonth}
          formatValue={formatValue}
        />
      ) : (
        <div className="data-state coverage-state">
          <p className="state-symbol" aria-hidden="true">
            —
          </p>
          <strong>Sin datos con cobertura suficiente</strong>
          <p>
            La humedad del suelo de esta comuna está excluida por calidad. Las
            otras variables siguen disponibles.
          </p>
        </div>
      )}
      <p className="sr-only">
        Datos mensuales. La tendencia mantiene su período completo de
        estimación.
      </p>
    </section>
  );
});
