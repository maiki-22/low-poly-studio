"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatedPath } from "./animated-path";
import { useLineChart } from "./context";
import {
  areaPath,
  chartGeometry,
  CHART_HEIGHT,
  linePath,
  PADDING,
} from "./model";

const tickFormatter = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 1,
});

export function LineChartPlot() {
  const chart = useLineChart();
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(440);
  const id = useId().replaceAll(":", "");
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const geometry = useMemo(
    () =>
      chartGeometry(
        chart.visible,
        chart.categories.length,
        width,
        chart.domain,
      ),
    [chart.visible, chart.categories.length, width, chart.domain],
  );
  const motionKey = chart.categories.join("|");
  const xTickCount = width < 360 ? 3 : 4;
  const xTicks = [
    ...new Set(
      Array.from({ length: xTickCount }, (_, i) =>
        Math.round((i * (chart.categories.length - 1)) / (xTickCount - 1)),
      ),
    ),
  ];
  return (
    <div
      ref={container}
      className="line-chart-plot"
      tabIndex={0}
      role="group"
      aria-label={`${chart.label}. Usa las flechas izquierda y derecha para recorrer los meses; Inicio y Fin para los extremos.`}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? chart.categories.length - 1
              : chart.activeIndex + (event.key === "ArrowRight" ? 1 : -1);
        chart.setActiveIndex(
          Math.max(0, Math.min(chart.categories.length - 1, next)),
        );
      }}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const position = ((event.clientX - bounds.left) * width) / bounds.width;
        const ratio =
          (position - PADDING.left) / (width - PADDING.left - PADDING.right);
        chart.setActiveIndex(
          Math.max(
            0,
            Math.min(
              chart.categories.length - 1,
              Math.round(ratio * (chart.categories.length - 1)),
            ),
          ),
        );
      }}
      onPointerLeave={() => chart.setActiveIndex(null)}
    >
      <svg
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        role="img"
        aria-labelledby={`${id}-title`}
      >
        <title id={`${id}-title`}>
          {chart.label}. Los datos también están disponibles en la tabla.
        </title>

        {geometry.ticks.map((value, index) => (
          <g key={index}>
            <line
              x1={PADDING.left}
              x2={width - PADDING.right}
              y1={geometry.y(value)}
              y2={geometry.y(value)}
              className="chart-grid"
            />
            <text
              x={PADDING.left - 10}
              y={geometry.y(value) + 4}
              textAnchor="end"
              className="chart-axis"
            >
              {tickFormatter.format(value)}
            </text>
          </g>
        ))}
        {xTicks.map((index) => (
          <text
            key={index}
            x={geometry.x(index)}
            y={CHART_HEIGHT - 7}
            textAnchor={
              index === 0
                ? "start"
                : index === chart.categories.length - 1
                  ? "end"
                  : "middle"
            }
            className="chart-axis"
          >
            {chart.formatCategory(chart.categories[index])}
          </text>
        ))}
        {chart.visible.map((row) => (
          <g key={row.id}>
            {geometry.segments(row).map((segment, index) => (
              <g key={index}>
                {!row.dashed && segment.length > 1 && (
                  <AnimatedPath
                    motionKey={motionKey}
                    d={areaPath(segment, geometry.bottom)}
                    fill={row.color}
                    fillOpacity={0.1}
                  />
                )}
                <AnimatedPath
                  motionKey={motionKey}
                  d={linePath(segment)}
                  fill="none"
                  stroke={row.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={row.dashed ? "5 5" : undefined}
                />
                {segment.length === 1 && (
                  <circle
                    cx={segment[0].x}
                    cy={segment[0].y}
                    r="3"
                    fill={row.color}
                  />
                )}
              </g>
            ))}
          </g>
        ))}
        <line
          x1={geometry.x(chart.activeIndex)}
          x2={geometry.x(chart.activeIndex)}
          y1={PADDING.top}
          y2={geometry.bottom}
          className="chart-cursor"
        />
        {chart.visible.map((row) => {
          const value = row.values[chart.activeIndex];
          return value == null ? null : (
            <circle
              key={row.id}
              cx={geometry.x(chart.activeIndex)}
              cy={geometry.y(value)}
              r="4"
              fill={row.color}
              stroke="var(--surface)"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
}
