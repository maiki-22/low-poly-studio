import {
  formatMonth,
  formatNumber,
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
        aria-label="Último mes registrado"
      >
        <span className="tile-label">
          {last ? formatMonth(last.start) : "Último mes"}
        </span>
        <p className="observation-value">
          {last?.value == null ? "—" : formatNumber(last.value)}
          <span>{series.unit}</span>
        </p>
      </section>
      <section
        className="observation-tile panel-surface"
        aria-label="Meses con datos"
      >
        <span className="tile-label">Meses con datos</span>
        <p className="observation-value">
          {valid}
          <span>/ {series.points.length}</span>
        </p>
      </section>
    </>
  );
}
