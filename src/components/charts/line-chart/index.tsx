"use client";

import { useMemo, useState, type ReactNode } from "react";
import { LineChartDataTable } from "./data-table";
import { LineChartContext } from "./context";
import { LineChartLegend } from "./legend";
import { LineChartPlot } from "./plot";
import { LineChartTooltip } from "./tooltip";
import type { LineChartSeries } from "./model";

export type LineChartProps = {
  series: readonly LineChartSeries[];
  categories: readonly string[];
  label: string;
  formatValue: (value: number) => string;
  formatCategory: (value: string) => string;
  domain?: readonly [number, number];
  children?: ReactNode;
};

/** Composable presentation only: no API calls, environmental rules or fabricated values. */
export function LineChart({
  series,
  categories,
  label,
  formatValue,
  formatCategory,
  domain,
  children,
}: LineChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const candidates = useMemo(
    () => series.filter((row) => !hidden.includes(row.id)),
    [series, hidden],
  );
  const visible = candidates.length ? candidates : series;
  const effectiveHidden = candidates.length ? hidden : [];
  if (!categories.length || !series.length)
    return <p className="empty-chart">No observations to display.</p>;
  return (
    <LineChartContext.Provider
      value={{
        series,
        visible,
        categories,
        label,
        formatValue,
        formatCategory,
        domain,
        activeIndex: Math.max(
          0,
          Math.min(categories.length - 1, activeIndex ?? categories.length - 1),
        ),
        setActiveIndex,
        hidden: effectiveHidden,
        toggleSeries: (id) =>
          setHidden((previous) =>
            previous.includes(id)
              ? previous.filter((item) => item !== id)
              : [...previous, id],
          ),
      }}
    >
      <section className="line-chart" aria-label={label}>
        {children === undefined ? (
          <>
            <LineChartTooltip />
            <LineChartPlot />
            {series.length > 1 && <LineChartLegend />}
          </>
        ) : (
          children
        )}
        <LineChartDataTable
          series={series}
          categories={categories}
          label={label}
          formatValue={formatValue}
          formatCategory={formatCategory}
        />
      </section>
    </LineChartContext.Provider>
  );
}

export { LineChartPlot, LineChartTooltip, LineChartLegend };
export type { LineChartSeries };
