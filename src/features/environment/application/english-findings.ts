import { formatUnit, type Finding } from "../domain/environment.ts";

const LABELS: Record<string, string> = {
  "conaf:heat": "Higher temperature",
  "conaf:rain_deficit": "Rainfall deficit",
  "conaf:rh_deficit": "Relative humidity deficit",
  "conaf:soil_deficit": "Soil moisture deficit",
};
const TITLES: Record<string, string> = {
  "evidencia independiente insuficiente": "insufficient evidence of an independent association",
  "asociación ajustada": "adjusted association",
  "asociación estable entre las variantes examinadas": "association consistent across the model variants examined",
  "asociación sensible al control temporal": "association sensitive to adjustment for time",
};
const DISCLAIMER = "These regional associations are explanatory and do not establish causality or provide forecasts.";
const ORIGINAL_DISCLAIMER = " Asociación explicativa regional, no causalidad ni pronóstico.";
const NUMBER = "([0-9.eE+−-]+)";

/** Translate the backend's published templates, retaining its actual numbers.
 * Unrecognized or changed text gets an explicit notice instead of stale copy.
 */
export function englishFinding(finding: Finding): Finding {
  const unavailable = (): Finding => ({
    ...finding,
    title: LABELS[finding.id] ?? "Published wildfire finding",
    summary: "An English summary is not yet available for this finding.",
  });
  if (finding.id === "conaf:monthly_presence") {
    const match = /^De (\d+) meses, (\d+) tienen incendios registrados y (\d+) tienen cero\. Son conteos regionales mensuales, no ubicaciones de ignición ni superficie quemada\.$/.exec(finding.summary);
    if (!match) return unavailable();
    return {
      ...finding,
      title: "Wildfire occurrence in the regional sample",
      summary: `Of ${match[1]} months, ${match[2]} have recorded wildfires and ${match[3]} have zero. These are monthly regional counts, not ignition locations or burned area.`,
    };
  }
  const label = LABELS[finding.id];
  const title = TITLES[finding.title.slice(finding.title.indexOf(": ") + 2)];
  if (!label || !title || !finding.summary.endsWith(ORIGINAL_DISCLAIMER)) return unavailable();
  const original = finding.summary.slice(0, -ORIGINAL_DISCLAIMER.length);
  const independent = new RegExp(`^El modelo principal no respalda una asociación independiente tras Holm \\(p=${NUMBER}\\)\\. Eso no demuestra ausencia de relación\\.$`).exec(original);
  if (independent) return {
    ...finding,
    title: `${label}: ${title}`,
    summary: `The main model does not support an independent association after Holm adjustment (p=${independent[1]}). This does not demonstrate the absence of a relationship. ${DISCLAIMER}`,
  };
  const association = new RegExp(`^Un (aumento|déficit adicional) de ${NUMBER} (.+?) en la anomalía mensual se asocia con una razón de tasas de ${NUMBER}, condicionado al modelo\\.(.*)$`).exec(original);
  if (!association) return unavailable();
  const [, direction, increment, rawUnit, ratio, tail] = association;
  const unit = formatUnit(rawUnit);
  if (!["°C", "mm/month", "percentage points", "kg/m²"].includes(unit)) return unavailable();
  let sensitivity = "";
  if (tail.trim() === "Conserva signo y evidencia en todas las variantes examinadas.") {
    sensitivity = "The direction and statistical evidence are consistent across all model variants examined.";
  } else if (tail.trim() === "La evidencia no es estable entre todas las variantes examinadas.") {
    sensitivity = "The statistical evidence is not consistent across all model variants examined.";
  } else if (tail.trim()) {
    const adjusted = new RegExp(`^ Al controlar cada año por separado pierde evidencia \\(p Holm=${NUMBER}\\)\\.$`).exec(tail);
    if (!adjusted) return unavailable();
    sensitivity = `The evidence is no longer sufficient after adjusting for each year separately (Holm-adjusted p=${adjusted[1]}).`;
  }
  return {
    ...finding,
    title: `${label}: ${title}`,
    summary: `An ${direction === "aumento" ? "increase" : "additional deficit"} of ${increment} ${unit} in the monthly anomaly is associated with a rate ratio of ${ratio}, conditional on the model. ${sensitivity ? `${sensitivity} ` : ""}${DISCLAIMER}`,
  };
}
