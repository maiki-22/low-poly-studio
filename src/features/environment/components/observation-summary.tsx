import {
  formatMonth,
  formatNumber,
  formatUnit,
  type EnvironmentalSeries,
} from "../domain/environment";

export function ObservationSummary({
  series,
}: {
  series: EnvironmentalSeries;
}) {
  const last = series.points.at(-1);
  const valid = series.points.filter((point) => point.value !== null).length;
  return (
    <>
      <section
        className="observation-tile panel-surface"
        aria-label="Latest recorded month"
      >
        <span className="tile-label">
          {last ? formatMonth(last.start) : "Latest month"}
        </span>
        <p className="observation-value">
          {last?.value == null ? "—" : formatNumber(last.value)}
          <span>{formatUnit(series.unit)}</span>
        </p>
      </section>
      <section
        className="observation-tile panel-surface"
        aria-label="Months with data"
      >
        <span className="tile-label">Months with data</span>
        <p className="observation-value">
          {valid}
          <span>/ {series.points.length}</span>
        </p>
      </section>
    </>
  );
}
