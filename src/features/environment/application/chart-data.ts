import type { EnvironmentalSeries } from "../domain/environment.ts";
import type { LineChartSeries } from "../../../components/charts/line-chart/model.ts";

export type ChartRange = "all" | "60" | "12";

export function environmentalChartData(
  primary: EnvironmentalSeries,
  comparison: EnvironmentalSeries | null,
  range: ChartRange,
  name: string,
  color: string,
) {
  const points = primary.points;
  const last = points.at(-1)?.start;
  let cutoff = "";
  if (last && range !== "all") {
    const date = new Date(`${last.slice(0, 7)}-01T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() - Number(range) + 1);
    cutoff = date.toISOString().slice(0, 10);
  }
  const selected = points.filter((point) => point.start >= cutoff);
  const categories = selected.map((point) => point.start);
  const series: LineChartSeries[] = [
    {
      id: "selected-territory",
      label: name,
      color,
      values: selected.map((point) => point.value),
    },
  ];
  if (comparison) {
    const byMonth = new Map(
      comparison.points.map((point) => [point.start, point.value]),
    );
    series.push({
      id: "region-reference",
      label: "La Araucanía",
      color: "#9fbaca",
      dashed: true,
      values: categories.map((month) => byMonth.get(month) ?? null),
    });
  }
  return { categories, series };
}
