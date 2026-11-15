"use client";

import { useCallback } from "react";
import { repositoryCache } from "./repository-cache";
import { useRemoteResource } from "@/hooks/use-remote-resource";
import {
  REGION_ID,
  type EnvironmentRepository,
  type SeriesSelection,
} from "../domain/environment";

export function useEnvironmentalData(
  repository: EnvironmentRepository,
  selection: SeriesSelection,
  compare: boolean,
) {
  const { variable, territoryId } = selection;
  const cache = repositoryCache(repository);
  const catalog = useRemoteResource(
    "catalog",
    useCallback((signal) => repository.catalog(signal), [repository]),
    cache,
  );
  const datasets = catalog.status === "ready" ? catalog.data : [];
  const seriesDataset = datasets.find(
    (dataset) =>
      dataset.id ===
      (territoryId === REGION_ID ? "ambiente_region" : "ambiente_comunas"),
  );
  const trendsDataset = datasets.find(
    (dataset) => dataset.id === "tendencias_ambientales",
  );
  const regionDataset = datasets.find(
    (dataset) => dataset.id === "ambiente_region",
  );
  const canRead =
    seriesDataset?.available &&
    seriesDataset.variables.includes(variable) &&
    seriesDataset.territories.includes(territoryId);
  const key = `${territoryId}:${variable}`;
  const canReadTrend = Boolean(
    trendsDataset?.available &&
    trendsDataset.variables.includes(variable) &&
    trendsDataset.territories.includes(territoryId),
  );
  const series = useRemoteResource(
    canRead ? `series:${key}` : null,
    useCallback(
      (signal) => repository.series({ variable, territoryId }, signal),
      [repository, variable, territoryId],
    ),
    cache,
  );
  const trend = useRemoteResource(
    canReadTrend ? `trend:${key}` : null,
    useCallback(
      (signal) => repository.trend({ variable, territoryId }, signal),
      [repository, variable, territoryId],
    ),
    cache,
  );
  const comparison = useRemoteResource(
    compare &&
      territoryId !== REGION_ID &&
      regionDataset?.available &&
      regionDataset.variables.includes(variable)
      ? `series:${REGION_ID}:${variable}`
      : null,
    useCallback(
      (signal) =>
        repository.series({ variable, territoryId: REGION_ID }, signal),
      [repository, variable],
    ),
    cache,
  );
  const fireAvailable = ["asociaciones_conaf", "hallazgos_conaf"].every(
    (id) =>
      datasets.some(
        (dataset) =>
          dataset.id === id &&
          dataset.available &&
          dataset.variables.includes(variable),
      ),
    cache,
  );
  return {
    catalog,
    series,
    trend,
    comparison,
    seriesDataset,
    fireAvailable,
    canRead,
    canReadTrend,
  };
}
