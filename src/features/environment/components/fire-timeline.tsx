"use client";

import { useEffect, useId, useState } from "react";
import { formatNumber } from "../domain/environment";
import { formatWildfireCount, seasonCount, type WildfireData } from "../domain/wildfires";
import { FIRE_MINIMUM_OPTIONS, meetsFireMinimum } from "../application/wildfire-display";

export function FireTimeline({ data, index, onChange, territoryId, minimum, onMinimumChange }: {
  data: WildfireData;
  index: number;
  onChange: (index: number) => void;
  territoryId: string;
  minimum: number;
  onMinimumChange: (minimum: number) => void;
}) {
  const id = useId();
  const [playing, setPlaying] = useState(false);
  const lastIndex = data.seasons.length - 1;
  const season = data.seasons[index];
  const count = season ? seasonCount(season, territoryId) : null;
  const visibleCommunes = season ? Object.values(season.counts).filter((value) => meetsFireMinimum(value, minimum)).length : 0;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (index >= lastIndex) setPlaying(false);
      else onChange(index + 1);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [playing, index, lastIndex, onChange]);

  if (!season) return <p>No seasons available.</p>;
  return (
    <section className="environmental-timeline fire-timeline" aria-label="Wildfire season timeline">
      <div className="timeline-heading">
        <label htmlFor={id}>Recorded wildfires</label>
        <output htmlFor={id} data-has-value={count !== null || undefined}>
          {count === null ? "No data" : formatNumber(count, 0)}
        </output>
      </div>
      <div className="timeline-track">
        <button
          type="button"
          aria-label={playing ? "Pause wildfire seasons" : "Play wildfire seasons"}
          aria-pressed={playing}
          disabled={data.seasons.length < 2}
          onClick={() => {
            if (!playing && index === lastIndex) onChange(0);
            setPlaying(!playing);
          }}
        ><span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span></button>
        <input id={id} type="range" min={0} max={Math.max(0, lastIndex)} step={1}
          value={index} disabled={data.seasons.length < 2}
          aria-valuetext={`${season.id} season, ${count === null ? "no data" : formatWildfireCount(count)}`}
          onChange={(event) => { setPlaying(false); onChange(Number(event.target.value)); }} />
      </div>
      <div className="timeline-dates">
        <span>{data.seasons[0]?.id.slice(0, 4)}</span>
        <span>{season.id.replace("-", "–")} season</span>
        <span>{data.seasons.at(-1)?.id.slice(-4)}</span>
      </div>
      <p className="fire-timeline-note">July–June · {territoryId === "09" ? "Regional total" : "Municipality total"}</p>
      <div className="fire-minimum-control">
        <label htmlFor={`${id}-minimum`}>Minimum count to display</label>
        <select id={`${id}-minimum`} value={minimum} onChange={(event) => onMinimumChange(Number(event.target.value))}>
          {FIRE_MINIMUM_OPTIONS.map((value) => <option key={value} value={value}>{formatWildfireCount(value)}</option>)}
        </select>
      </div>
      <p className="fire-timeline-note">Flames shown: {visibleCommunes} of 32 municipalities. Locations are symbolic.</p>
      <p className="fire-timeline-note">Areas without a flame may have counts below the threshold. The total includes all records.</p>
      <details className="fire-counts-table">
        <summary>View counts by season</summary>
        <table>
          <caption className="sr-only">Recorded wildfires by season in the selected area</caption>
          <thead><tr><th scope="col">Season</th><th scope="col">Wildfires</th></tr></thead>
          <tbody>{data.seasons.map((row, rowIndex) => {
            const value = seasonCount(row, territoryId);
            return <tr key={row.id} aria-current={rowIndex === index ? "true" : undefined}>
              <th scope="row"><button type="button" onClick={() => { setPlaying(false); onChange(rowIndex); }}>{row.id}</button></th>
              <td>{value === null ? "No data" : formatNumber(value, 0)}</td>
            </tr>;
          })}</tbody>
        </table>
      </details>
    </section>
  );
}
