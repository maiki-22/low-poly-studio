import { DetailDialog } from "@/components/ui/detail-dialog";
import { Icon } from "@/components/ui/icon";
import {
  formatNumber,
  formatSigned,
  periodLabel,
  TREND_LABELS,
  VARIABLES,
  type EnvironmentalTrend,
} from "../domain/environment";

export function TrendSummary({
  trend,
  territoryName,
}: {
  trend: EnvironmentalTrend;
  territoryName: string;
}) {
  const variable = VARIABLES[trend.variable];
  const covered = trend.status !== "insufficient_coverage";
  const evidence =
    trend.status === "evidence_increasing" ||
    trend.status === "evidence_decreasing";
  return (
    <section className="trend-summary" aria-label="Tendencia ambiental">
      <div className="trend-topline">
        <span className={`evidence-badge${evidence ? " has-evidence" : ""}`}>
          <Icon
            name={
              evidence
                ? trend.status === "evidence_increasing"
                  ? "trend-up"
                  : "trend-down"
                : "info"
            }
          />
          {TREND_LABELS[trend.status]}
        </span>
        <span className="trend-period">
          {periodLabel(trend.periodStart, trend.periodEnd)}
        </span>
      </div>
      {covered && trend.slope !== null ? (
        <>
          <p className="trend-magnitude">
            {formatSigned(trend.slope)}
            <span>{trend.unit}</span>
          </p>
        </>
      ) : (
        <p className="coverage-message">
          La cobertura de esta variable no es suficiente para estimar una
          tendencia. Puedes explorar las otras variables de esta comuna.
        </p>
      )}
      <DetailDialog
        title="Evidencia estadística"
        description={`${territoryName} · ${variable.label}`}
        trigger="Ver evidencia"
        triggerClassName="evidence-trigger"
      >
        <div className="evidence-content">
          <p>{variable.definition}</p>
          {covered && trend.low !== null && trend.high !== null && (
            <p>
              Intervalo marginal del 95 %:{" "}
              <strong>
                {formatNumber(trend.low)} a {formatNumber(trend.high)}
              </strong>{" "}
              {trend.unit}.
            </p>
          )}
          <p>
            {trend.nUsed} meses utilizados. Período de estimación:{" "}
            {periodLabel(trend.periodStart, trend.periodEnd)}.
          </p>
          {trend.pHolm !== null && (
            <p>
              p corregido por Holm:{" "}
              {trend.pHolm < 0.001 ? "< 0,001" : formatNumber(trend.pHolm, 3)}.
              La etiqueta de evidencia incorpora esta corrección; el intervalo
              es marginal.
            </p>
          )}
          {trend.variable === "relative_humidity_2m_pct" && (
            <p>
              El cambio se expresa en puntos porcentuales, no como porcentaje de
              disminución.
            </p>
          )}
          <p>
            El rango del gráfico no modifica esta tendencia. Las estimaciones
            ambientales representan áreas de una malla; no son mediciones
            puntuales en cada comuna.
          </p>
        </div>
      </DetailDialog>
    </section>
  );
}
