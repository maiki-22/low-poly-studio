export type LineChartSeries = {
  id: string;
  label: string;
  color: string;
  values: readonly (number | null)[];
  dashed?: boolean;
};
export type ChartPoint = { x: number; y: number; index: number };
export const PADDING = { left: 46, right: 14, top: 16, bottom: 30 };
export const CHART_HEIGHT = 164;

export function chartGeometry(
  series: readonly LineChartSeries[],
  count: number,
  width: number,
  domain?: readonly [number, number],
) {
  const values = series.flatMap((row) =>
    row.values.filter(
      (value): value is number => value !== null && Number.isFinite(value),
    ),
  );
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const extra = Math.max((max - min) * 0.12, Math.abs(max) * 0.02, 0.1);
  const low =
    domain?.[0] ?? (min >= 0 ? Math.max(0, min - extra) : min - extra);
  const high = domain?.[1] ?? max + extra;
  const bottom = CHART_HEIGHT - PADDING.bottom;
  const x = (index: number) =>
    PADDING.left +
    (count <= 1 ? 0.5 : index / (count - 1)) *
      (width - PADDING.left - PADDING.right);
  const y = (value: number) =>
    bottom - ((value - low) / (high - low || 1)) * (bottom - PADDING.top);
  const segments = (row: LineChartSeries): ChartPoint[][] => {
    const result: ChartPoint[][] = [];
    let current: ChartPoint[] = [];
    row.values.forEach((value, index) => {
      if (value === null || !Number.isFinite(value)) {
        if (current.length) result.push(current);
        current = [];
      } else current.push({ x: x(index), y: y(value), index });
    });
    if (current.length) result.push(current);
    return result;
  };
  return {
    x,
    y,
    bottom,
    segments,
    ticks: Array.from({ length: 5 }, (_, i) => low + ((high - low) * i) / 4),
  };
}

export function linePath(points: readonly ChartPoint[]): string {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`,
    )
    .join(" ");
}

export function areaPath(
  points: readonly ChartPoint[],
  bottom: number,
): string {
  if (!points.length) return "";
  return `${linePath(points)} L${points[points.length - 1].x.toFixed(2)},${bottom} L${points[0].x.toFixed(2)},${bottom} Z`;
}
