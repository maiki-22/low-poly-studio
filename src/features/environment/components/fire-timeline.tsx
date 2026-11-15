"use client";

import { useEffect, useId, useState } from "react";
import { formatNumber } from "../domain/environment";
import { seasonCount, type WildfireData } from "../domain/wildfires";
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

  if (!season) return <p>No hay temporadas disponibles.</p>;
  return (
    <section className="environmental-timeline fire-timeline" aria-label="Línea de tiempo de incendios">
      <div className="timeline-heading">
        <label htmlFor={id}>Incendios registrados</label>
        <output htmlFor={id} data-has-value={count !== null || undefined}>
          {count === null ? "Sin datos" : formatNumber(count, 0)}
        </output>
      </div>
      <div className="timeline-track">
        <button
          type="button"
          aria-label={playing ? "Pausar temporadas de incendios" : "Reproducir temporadas de incendios"}
          aria-pressed={playing}
          disabled={data.seasons.length < 2}
          onClick={() => {
            if (!playing && index === lastIndex) onChange(0);
            setPlaying(!playing);
          }}
        ><span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span></button>
        <input id={id} type="range" min={0} max={Math.max(0, lastIndex)} step={1}
          value={index} disabled={data.seasons.length < 2}
          aria-valuetext={`Temporada ${season.id}, ${count === null ? "sin datos" : `${count} incendios`}`}
          onChange={(event) => { setPlaying(false); onChange(Number(event.target.value)); }} />
      </div>
      <div className="timeline-dates">
        <span>{data.seasons[0]?.id.slice(0, 4)}</span>
        <span>Temporada {season.id.replace("-", "–")}</span>
        <span>{data.seasons.at(-1)?.id.slice(-4)}</span>
      </div>
      <p className="fire-timeline-note">Julio–junio · {territoryId === "09" ? "Total regional" : "Total de la comuna"}</p>
      <div className="fire-minimum-control">
        <label htmlFor={`${id}-minimum`}>Mostrar llamas desde</label>
        <select id={`${id}-minimum`} value={minimum} onChange={(event) => onMinimumChange(Number(event.target.value))}>
          {FIRE_MINIMUM_OPTIONS.map((value) => <option key={value} value={value}>{value} {value === 1 ? "incendio" : "incendios"}</option>)}
        </select>
      </div>
      <p className="fire-timeline-note">Llamas visibles: {visibleCommunes} de 32 comunas. Ubicaciones simbólicas.</p>
      <p className="fire-timeline-note">Sin llama puede haber registros inferiores al mínimo. El total incluye todos los registros.</p>
      <details className="fire-counts-table">
        <summary>Ver conteos por temporada</summary>
        <table>
          <caption className="sr-only">Incendios registrados por temporada en el territorio seleccionado</caption>
          <thead><tr><th scope="col">Temporada</th><th scope="col">Incendios</th></tr></thead>
          <tbody>{data.seasons.map((row, rowIndex) => {
            const value = seasonCount(row, territoryId);
            return <tr key={row.id} aria-current={rowIndex === index ? "true" : undefined}>
              <th scope="row"><button type="button" onClick={() => { setPlaying(false); onChange(rowIndex); }}>{row.id}</button></th>
              <td>{value === null ? "Sin datos" : formatNumber(value, 0)}</td>
            </tr>;
          })}</tbody>
        </table>
      </details>
    </section>
  );
}
