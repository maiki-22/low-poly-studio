"use client";

import { useCallback } from "react";
import { useRemoteResource } from "@/hooks/use-remote-resource";
import {
  formatMonth,
  formatNumber,
  formatUnit,
  type EnvironmentRepository,
  type VariableId,
} from "../domain/environment";
import { DataError } from "./data-state";
import { repositoryCache } from "../application/repository-cache";
import { englishFinding } from "../application/english-findings";

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
        Loading regional analysis…
      </p>
    );
  const { association, findings } = resource.data;
  return (
    <div className="fire-content">
      <p className="regional-notice">
        This analysis covers all of La Araucanía.
      </p>
      {association && association.ratio !== null && (
        <>
          <p className="association-value">
            {formatNumber(association.ratio)}
            <span>rate ratio</span>
          </p>
          <p>
            For an{" "}
            {association.direction === "decrease"
              ? "additional deficit"
              : "increase"}{" "}
            of {formatNumber(association.increment)} {formatUnit(association.unit)} in the
            monthly anomaly, conditional on the model.
          </p>
          {association.low !== null && association.high !== null && (
            <p className="association-interval">
              Marginal 95% confidence interval: {formatNumber(association.low)}–
              {formatNumber(association.high)}.
            </p>
          )}
          <p className="association-interval">
            {formatMonth(association.periodStart)} –{" "}
            {formatMonth(association.periodEnd)}.
          </p>
        </>
      )}
      {findings.map(englishFinding).map((finding) => (
        <div key={finding.id} className="finding">
          <h4>{finding.title}</h4>
          <p>{finding.summary}</p>
        </div>
      ))}
      {!association && !findings.length && (
        <p>No published results for this variable.</p>
      )}
      <p className="chart-note">
        An anomaly is the difference from the reference value for each calendar
        month in the analysis. The rate ratio compares expected counts under the
        model; it does not represent the probability of an individual wildfire.
      </p>
    </div>
  );
}
