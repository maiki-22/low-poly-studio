import { DetailDialog } from "@/components/ui/detail-dialog";
import { Icon } from "@/components/ui/icon";
import {
  formatNumber,
  formatSigned,
  formatUnit,
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
    <section className="trend-summary" aria-label="Environmental trend">
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
            <span>{formatUnit(trend.unit)}</span>
          </p>
        </>
      ) : (
        <p className="coverage-message">
          Data coverage is insufficient to estimate a trend for this variable.
          You can explore the other variables for this municipality.
        </p>
      )}
      <DetailDialog
        title="Statistical evidence"
        description={`${territoryName} · ${variable.label}`}
        trigger="View evidence"
        triggerClassName="evidence-trigger"
      >
        <div className="evidence-content">
          <p>{variable.definition}</p>
          {covered && trend.low !== null && trend.high !== null && (
            <p>
              Marginal 95% confidence interval:{" "}
              <strong>
                {formatNumber(trend.low)} to {formatNumber(trend.high)}
              </strong>{" "}
              {formatUnit(trend.unit)}.
            </p>
          )}
          <p>
            {trend.nUsed} months used. Analysis period:{" "}
            {periodLabel(trend.periodStart, trend.periodEnd)}.
          </p>
          {trend.pHolm !== null && (
            <p>
              Holm-adjusted p-value:{" "}
              {trend.pHolm < 0.001 ? "< 0.001" : formatNumber(trend.pHolm, 3)}.{" "}
              The evidence label accounts for this adjustment; the confidence
              interval is marginal.
            </p>
          )}
          {trend.variable === "relative_humidity_2m_pct" && (
            <p>
              Change is expressed in percentage points rather than as a
              percentage decrease.
            </p>
          )}
          <p>
            Changing the chart range does not change this trend estimate.
            Environmental estimates represent grid-cell areas rather than
            point measurements within each municipality.
          </p>
        </div>
      </DetailDialog>
    </section>
  );
}
