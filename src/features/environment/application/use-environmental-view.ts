"use client";

import { useState } from "react";
import type { VariableId } from "../domain/environment";
import type { useEnvironmentalData } from "./use-environmental-data";

type Data = ReturnType<typeof useEnvironmentalData>;
type View = {
  territoryId: string;
  territoryName: string;
  variable: VariableId;
  data: Data;
};

/** Commit a territory's series and trend together. Pending views retain their original labels. */
export function useEnvironmentalView(
  data: Data,
  selection: Omit<View, "data">,
) {
  const [committed, setCommitted] = useState<View | null>(null);
  const waiting =
    data.catalog.status === "idle" ||
    data.catalog.status === "loading" ||
    (data.canRead &&
      (data.series.status === "idle" || data.series.status === "loading")) ||
    (data.canReadTrend &&
      (data.trend.status === "idle" || data.trend.status === "loading"));
  const candidate = { ...selection, data };
  const series = data.series.status === "ready" ? data.series.data : null;
  const trend = data.trend.status === "ready" ? data.trend.data : null;
  const comparison =
    data.comparison.status === "ready" ? data.comparison.data : null;
  const previousSeries =
    committed?.data.series.status === "ready"
      ? committed.data.series.data
      : null;
  const previousTrend =
    committed?.data.trend.status === "ready" ? committed.data.trend.data : null;
  const previousComparison =
    committed?.data.comparison.status === "ready"
      ? committed.data.comparison.data
      : null;
  if (
    !waiting &&
    data.series.status === "ready" &&
    (!committed ||
      committed.territoryId !== selection.territoryId ||
      committed.variable !== selection.variable ||
      series !== previousSeries ||
      trend !== previousTrend ||
      comparison !== previousComparison)
  ) {
    setCommitted(candidate);
  }
  return {
    view: waiting && committed ? committed : candidate,
    updating: Boolean(waiting && committed),
  };
}
