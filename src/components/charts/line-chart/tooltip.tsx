"use client";

import { useLineChart } from "./context";

export function LineChartTooltip() {
  const chart = useLineChart();
  return (
    <div className="chart-readout" aria-live="polite" aria-atomic="true">
      <span>{chart.formatCategory(chart.categories[chart.activeIndex])}</span>
      <div>
        {chart.visible.map((row) => (
          <span key={row.id} className="chart-readout-value">
            <span
              className="series-dot"
              style={{ backgroundColor: row.color }}
            />
            <span className="sr-only">{row.label}: </span>
            <strong>
              {row.values[chart.activeIndex] == null
                ? "Sin datos"
                : chart.formatValue(row.values[chart.activeIndex]!)}
            </strong>
          </span>
        ))}
      </div>
    </div>
  );
}
