"use client";

import { memo, type CSSProperties, type ReactNode } from "react";
import { DetailDialog } from "@/components/ui/detail-dialog";
import type { ChartRange } from "../application/chart-data";
import { useEnvironmentalView } from "../application/use-environmental-view";
import { Icon } from "@/components/ui/icon";
import { useEnvironmentalData } from "../application/use-environmental-data";
import {
  REGION_ID,
  VARIABLE_IDS,
  VARIABLES,
  type EnvironmentRepository,
  type VariableId,
} from "../domain/environment";
import { environmentRepository } from "../infrastructure/http-repository";
import { DataError, DataLoading } from "./data-state";
import { EnvironmentalChart } from "./environmental-chart";
import { FireContext } from "./fire-context";
import { ObservationSummary } from "./observation-summary";
import { TrendSummary } from "./trend-summary";

type EnvironmentalData = ReturnType<typeof useEnvironmentalData>;

function SeriesTile({
  data,
  territoryName,
  compare,
  onCompareChange,
  isCommune,
  range,
  onRangeChange,
}: {
  data: EnvironmentalData;
  territoryName: string;
  compare: boolean;
  onCompareChange: (value: boolean) => void;
  isCommune: boolean;
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
}) {
  const current = data.series.status === "ready" ? data.series.data : null;
  const comparison =
    data.comparison.status === "ready" ? data.comparison.data : null;
  return (
    <section
      className="chart-tile panel-surface panel-data"
      aria-label="Serie ambiental"
      aria-busy={
        data.catalog.status === "loading" || data.series.status === "loading"
      }
    >
      {data.catalog.status === "error" ? (
        <DataError
          message={data.catalog.error.message}
          onRetry={data.catalog.retry}
        />
      ) : data.catalog.status !== "ready" ? (
        <DataLoading />
      ) : !data.canRead ? (
        <div className="data-state">
          <strong>Datos no disponibles</strong>
          <p>Prueba otra variable o territorio.</p>
          <button
            type="button"
            className="soft-button"
            onClick={data.catalog.retry}
          >
            Actualizar
          </button>
        </div>
      ) : data.series.status === "error" ? (
        <DataError
          message={data.series.error.message}
          onRetry={data.series.retry}
        />
      ) : data.series.status !== "ready" ? (
        <DataLoading />
      ) : !current?.points.length ? (
        <div className="data-state">
          <strong>Sin observaciones</strong>
          <p>Selecciona otra variable o territorio.</p>
        </div>
      ) : (
        <>
          <EnvironmentalChart
            series={current}
            comparison={comparison}
            territoryName={territoryName}
            range={range}
            onRangeChange={onRangeChange}
          />
          <div className="comparison-control">
            <label>
              <input
                type="checkbox"
                checked={isCommune && compare}
                disabled={!isCommune}
                onChange={(event) => onCompareChange(event.target.checked)}
              />
              <span>
                {isCommune
                  ? "Comparar con La Araucanía"
                  : "Elige una comuna para comparar"}
              </span>
            </label>
            {data.comparison.status === "loading" && (
              <span role="status">Cargando…</span>
            )}
            {data.comparison.status === "error" && (
              <button type="button" onClick={data.comparison.retry}>
                Reintentar comparación
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export const EnvironmentalPanel = memo(function EnvironmentalPanel({
  territoryId,
  territoryName,
  repository = environmentRepository,
  territoryView,
  timelineView,
  variable,
  onVariableChange,
  range,
  onRangeChange,
  compare,
  onCompareChange,
}: {
  territoryId: string;
  territoryName: string;
  repository?: EnvironmentRepository;
  territoryView: ReactNode;
  timelineView?: ReactNode;
  variable: VariableId;
  onVariableChange: (variable: VariableId) => void;
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  compare: boolean;
  onCompareChange: (compare: boolean) => void;
}) {
  const data = useEnvironmentalData(
    repository,
    { variable, territoryId },
    compare,
  );
  const { view, updating } = useEnvironmentalView(data, {
    territoryId,
    territoryName,
    variable,
  });
  const display = view.data;
  const current =
    display.series.status === "ready" ? display.series.data : null;
  return (
    <aside
      className="environmental-panel"
      style={
        { "--variable-color": VARIABLES[view.variable].color } as CSSProperties
      }
      aria-label={`Datos ambientales de ${view.territoryName}`}
      data-updating={updating || undefined}
      aria-busy={updating || undefined}
    >
      <div
        className="variable-selector panel-surface"
        role="group"
        aria-label="Variable ambiental"
      >
        <h2>Variable ambiental</h2>
        {VARIABLE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            aria-label={VARIABLES[id].label}
            aria-pressed={variable === id}
            style={{ "--option-color": VARIABLES[id].color } as CSSProperties}
            disabled={
              data.catalog.status === "ready" &&
              !data.seriesDataset?.variables.includes(id)
            }
            onClick={() => onVariableChange(id)}
          >
            <Icon name={VARIABLES[id].symbol} />
            <span className="variable-label">{VARIABLES[id].label}</span>
          </button>
        ))}
      </div>
      {territoryView}
      {updating && (
        <p className="selection-update" role="status">
          Actualizando a {territoryName}…
        </p>
      )}
      <div className="data-column">
        {timelineView && <div className="map-timeline">{timelineView}</div>}
        <section
          className="trend-tile panel-surface"
          id="datos"
          tabIndex={-1}
          aria-labelledby="panel-title"
        >
          <header className="panel-header">
            <h2 id="panel-title">{view.territoryName}</h2>
            <span>{view.territoryId === REGION_ID ? "Región" : "Comuna"}</span>
          </header>
          <p className="active-variable">{VARIABLES[view.variable].label}</p>
          {display.trend.status === "ready" && display.trend.data ? (
            <TrendSummary
              trend={display.trend.data}
              territoryName={view.territoryName}
            />
          ) : display.trend.status === "error" ? (
            <div className="inline-error" role="alert">
              Tendencia no disponible.{" "}
              <button type="button" onClick={display.trend.retry}>
                Reintentar
              </button>
            </div>
          ) : (
            <p className="inline-status" role="status">
              {display.catalog.status === "error"
                ? "Sin conexión con los datos"
                : display.trend.status === "idle" &&
                    display.catalog.status === "ready"
                  ? "Sin tendencia publicada"
                  : "Consultando tendencia…"}
            </p>
          )}
        </section>
        {current && <ObservationSummary series={current} />}
        <DetailDialog
          title="Análisis regional de incendios"
          description={`${VARIABLES[view.variable].label} · Toda La Araucanía`}
          triggerClassName="fire-details panel-surface"
          trigger={
            <>
              <Icon name="fire" />
              <span>
                Incendios<small>Toda La Araucanía</small>
              </span>
              <Icon name="arrow" />
            </>
          }
        >
          {display.fireAvailable ? (
            <FireContext variable={view.variable} repository={repository} />
          ) : (
            <p className="inline-status">Análisis no disponible.</p>
          )}
        </DetailDialog>
      </div>
      <SeriesTile
        data={display}
        territoryName={view.territoryName}
        compare={compare}
        onCompareChange={onCompareChange}
        isCommune={view.territoryId !== REGION_ID}
        range={range}
        onRangeChange={onRangeChange}
      />
    </aside>
  );
});
