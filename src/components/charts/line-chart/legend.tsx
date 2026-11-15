"use client";

import { useLineChart } from "./context";

export function LineChartLegend() {
  const chart = useLineChart();
  return (
    <div className="chart-legend" aria-label="Series del gráfico">
      {chart.series.map((row) => {
        const hidden = chart.hidden.includes(row.id);
        return (
          <button
            key={row.id}
            type="button"
            aria-pressed={!hidden}
            disabled={!hidden && chart.visible.length === 1}
            onClick={() => chart.toggleSeries(row.id)}
          >
            <span
              className={`legend-line${row.dashed ? " is-dashed" : ""}`}
              style={{ borderColor: row.color }}
            />
            {row.label}
          </button>
        );
      })}
    </div>
  );
}
