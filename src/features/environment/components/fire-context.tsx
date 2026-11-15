"use client";

import { useCallback } from "react";
import { useRemoteResource } from "@/hooks/use-remote-resource";
import {
  formatMonth,
  formatNumber,
  type EnvironmentRepository,
  type VariableId,
} from "../domain/environment";
import { DataError } from "./data-state";
import { repositoryCache } from "../application/repository-cache";

export function FireContext({
  variable,
  repository,
}: {
  variable: VariableId;
  repository: EnvironmentRepository;
}) {
  const resource = useRemoteResource(
    `fire:${variable}`,
    useCallback(
      (signal) => repository.fireContext(variable, signal),
      [repository, variable],
    ),
    repositoryCache(repository),
  );
  if (resource.status === "error")
    return (
      <DataError message={resource.error.message} onRetry={resource.retry} />
    );
  if (resource.status !== "ready")
    return (
      <p className="inline-status" role="status">
        Consultando el análisis regional…
      </p>
    );
  const { association, findings } = resource.data;
  return (
    <div className="fire-content">
      <p className="regional-notice">
        Este análisis corresponde a toda La Araucanía.
      </p>
      {association && association.ratio !== null && (
        <>
          <p className="association-value">
            {formatNumber(association.ratio)}
            <span>razón de tasas</span>
          </p>
          <p>
            Por un{" "}
            {association.direction === "decrease"
              ? "déficit adicional"
              : "aumento"}{" "}
            de {formatNumber(association.increment)} {association.unit} en la
            anomalía mensual, condicionado al modelo.
          </p>
          {association.low !== null && association.high !== null && (
            <p className="association-interval">
              Intervalo marginal del 95 %: {formatNumber(association.low)}–
              {formatNumber(association.high)}.
            </p>
          )}
          <p className="association-interval">
            {formatMonth(association.periodStart)} –{" "}
            {formatMonth(association.periodEnd)}.
          </p>
        </>
      )}
      {findings.map((finding) => (
        <div key={finding.id} className="finding">
          <h4>{finding.title}</h4>
          <p>{finding.summary}</p>
        </div>
      ))}
      {!association && !findings.length && (
        <p>No hay resultados publicados para esta variable.</p>
      )}
      <p className="chart-note">
        Una anomalía es la diferencia respecto de la referencia de cada mes del
        análisis. La razón compara conteos esperados bajo el modelo; no
        representa una probabilidad individual de incendio.
      </p>
    </div>
  );
}
