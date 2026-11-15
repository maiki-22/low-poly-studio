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
  formatUnit,
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
    (value: number) => `${formatNumber(value)} ${formatUnit(series.unit)}`,
    [series.unit],
  );
  const hasData = series.points.some((point) => point.value !== null);
  return (
    <section className="environmental-chart" aria-label="Monthly time series">
      <div className="chart-heading">
        <h3>Monthly time series</h3>
        <div className="range-controls" aria-label="Visible chart range">
          {(
            [
              ["all", "Full period"],
              ["60", "5 years"],
              ["12", "1 year"],
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
          label={`${variable.label} in ${territoryName}`}
          formatCategory={formatMonth}
          formatValue={formatValue}
        />
      ) : (
        <div className="data-state coverage-state">
          <p className="state-symbol" aria-hidden="true">
            —
          </p>
          <strong>Insufficient data coverage</strong>
          <p>
            Soil moisture for this municipality is excluded because of data
            quality. Other variables are still available.
          </p>
        </div>
      )}
      <p className="sr-only">
        Monthly data. The trend estimate always uses the full
        analysis period.
      </p>
    </section>
  );
});
