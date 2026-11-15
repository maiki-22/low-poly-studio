"use client";

import { useEffect, useId, useState } from "react";
import { useEnvironmentalData } from "../application/use-environmental-data";
import { environmentRepository } from "../infrastructure/http-repository";
import {
  formatMonth,
  formatNumber,
  formatUnit,
  VARIABLES,
  type VariableId,
} from "../domain/environment";

export function EnvironmentalTimeline({
  territoryId,
  variable,
  onMonthChange,
}: {
  territoryId: string;
  variable: VariableId;
  onMonthChange?: (month: string | null) => void;
}) {
  const id = useId();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  // Share the panel's repository cache: scrubbing never makes a request per month.
  const data = useEnvironmentalData(
    environmentRepository,
    { territoryId, variable },
    false,
  );
  const series = data.series.status === "ready" ? data.series.data : null;
  const points = series?.points ?? [];
  const lastIndex = Math.max(0, points.length - 1);
  const selectedIndex = Math.min(index, lastIndex);
  const point = points[selectedIndex];
  const error = data.catalog.status === "error"
    ? data.catalog
    : data.series.status === "error" ? data.series : null;
  const loading = data.catalog.status === "idle" ||
    data.catalog.status === "loading" || data.series.status === "loading";
  const value = point?.value == null
    ? "No data"
    : `${formatNumber(point.value)} ${formatUnit(series?.unit ?? VARIABLES[variable].unit)}`;

  const month = point?.start ?? null;
  useEffect(() => { onMonthChange?.(month); }, [month, onMonthChange]);

  useEffect(() => {
    if (!playing || !points.length) return;
    const timer = window.setTimeout(() => {
      if (selectedIndex >= lastIndex) {
        setPlaying(false);
      } else {
        setIndex(selectedIndex + 1);
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [playing, selectedIndex, lastIndex, points.length]);

  return (
    <section className="environmental-timeline" aria-label="Monthly climate timeline" aria-busy={loading}>
      <div className="timeline-heading">
        <label htmlFor={id}>{VARIABLES[variable].label}</label>
        <output htmlFor={id} data-has-value={!error && !loading && point?.value != null || undefined}>
          {error ? "Connection unavailable" : loading ? "Loading…" : point ? value : "No observations"}
        </output>
      </div>
      <div className="timeline-track">
        <button
          type="button"
          aria-label={playing ? "Pause monthly timeline" : "Play monthly timeline"}
          aria-pressed={playing}
          disabled={points.length < 2}
          onClick={() => {
            if (!playing && selectedIndex === lastIndex) setIndex(0);
            setPlaying(!playing);
          }}
        >
          <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
        </button>
        <input
          id={id}
          type="range"
          min={0}
          max={lastIndex}
          step={1}
          value={selectedIndex}
          disabled={!point || !!error}
          aria-valuetext={point ? `${formatMonth(point.start, true)}: ${value}` : "No observations"}
          onChange={(event) => {
            setPlaying(false);
            setIndex(Number(event.target.value));
          }}
        />
      </div>
      <div className="timeline-dates">
        <span>{points[0]?.start.slice(0, 4) ?? "2014"}</span>
        {!error && (
          <span>{point ? formatMonth(point.start, true) : "Monthly timeline"}</span>
        )}
        <span>{points.at(-1)?.start.slice(0, 4) ?? "2023"}</span>
      </div>
    </section>
  );
}
