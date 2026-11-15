"use client";

import Link from "next/link";
import Image from "next/image";
import { TerritoryPicker } from "./territory-picker";
import { useCallback, useState } from "react";
import { useExplorerNavigation } from "@/features/environment/application/use-explorer-navigation";
import type { VariableId } from "@/features/environment/domain/environment";
import type { ChartRange } from "@/features/environment/application/chart-data";
import communes from "@/data/communes.json";
import { MapViewport } from "./map-viewport";
import { EnvironmentalPanel } from "@/features/environment/components/environmental-panel";
import { Icon } from "@/components/ui/icon";
import { IoArrowBackOutline } from "react-icons/io5";
import { EnvironmentalTimeline } from "@/features/environment/components/environmental-timeline";
import { FireTimeline } from "@/features/environment/components/fire-timeline";
import { useWildfires } from "@/features/environment/application/use-wildfires";
import { formatNumber } from "@/features/environment/domain/environment";
import { DEFAULT_FIRE_MINIMUM } from "@/features/environment/application/wildfire-display";

export default function MapExplorer() {
  const navigation = useExplorerNavigation();
  const [timeline, setTimeline] = useState<"environment" | "fires">("fires");
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [fireMinimum, setFireMinimum] = useState(DEFAULT_FIRE_MINIMUM);
  const [month, setMonth] = useState<string | null>(null);
  const wildfires = useWildfires();
  const fireData = wildfires.status === "ready" ? wildfires.data : null;
  const season = fireData?.seasons[seasonIndex] ?? null;
  const maximum = fireData ? Math.max(0, ...fireData.seasons.flatMap((row) => Object.values(row.counts).map((count) => count ?? 0))) : 0;
  const monthlyFires = fireData?.months.find((point) => point.start === month);
  const { update } = navigation;
  const selectedId =
    navigation.territoryId === "09" ? null : navigation.territoryId;
  const setSelectedId = useCallback(
    (id: string | null) => update({ territoryId: id ?? "09" }),
    [update],
  );
  const setVariable = useCallback(
    (variable: VariableId) => update({ variable }),
    [update],
  );
  const setRange = useCallback(
    (range: ChartRange) => update({ range }),
    [update],
  );
  const setCompare = useCallback(
    (compare: boolean) => update({ compare }),
    [update],
  );
  const selected = communes.find((commune) => commune.id === selectedId);

  return (
    <main className="explorer">
      <a className="skip-link" href="#mapa">
        Saltar al mapa
      </a>
      <a className="skip-link" href="#datos">
        Saltar a los datos
      </a>
      <h1 className="sr-only">DeHecho: explorador ambiental de La Araucanía</h1>
      <header className="explorer-header">
        <Link className="brand" href="/" aria-label="Volver al inicio">
        <IoArrowBackOutline size={20} strokeWidth={2} />

        <Image
          className="brand-logo"
          src="/brand/logo-dehecho-mark.svg"
          alt=""
          width={52}
          height={52}
          priority
        />

        <span>
          DeHecho
          <small>Explorador ambiental</small>
        </span>
      </Link>
      </header>
      <div className="territory-tools">
        <div className="territory-controls">
          <span className="control-label">Territorio</span>
          <TerritoryPicker
            value={selectedId ?? "09"}
            onChange={(id) => setSelectedId(id === "09" ? null : id)}
          />
          <span className="control-period">{timeline === "fires" ? "2014–2024" : "2014–2023"}</span>
          {selectedId && (
            <button
              type="button"
              aria-label="Volver a la región"
              onClick={() => {
                setSelectedId(null);
              }}
            >
              <Icon name="close" />
            </button>
          )}
        </div>
      </div>
      <EnvironmentalPanel
        timelineView={<>
        <div className="timeline-mode" role="group" aria-label="Contenido de la línea de tiempo">
          <button type="button" aria-pressed={timeline === "fires"} onClick={() => setTimeline("fires")}>Incendios por temporada</button>
          <button type="button" aria-pressed={timeline === "environment"} onClick={() => setTimeline("environment")}>Clima mensual</button>
        </div>
        {timeline === "environment" ? <>
          <EnvironmentalTimeline
            key={`${navigation.territoryId}:${navigation.variable}`}
            territoryId={navigation.territoryId}
            variable={navigation.variable}
            onMonthChange={setMonth}
          />
          {fireData && <p className="monthly-fire-count">
            {monthlyFires?.value != null
              ? `${formatNumber(monthlyFires.value, 0)} incendios en la región este mes`
              : "Sin conteo regional de incendios para este mes"}
          </p>}
        </> : fireData ? (
          <FireTimeline data={fireData} index={seasonIndex} onChange={setSeasonIndex} territoryId={navigation.territoryId}
            minimum={fireMinimum} onMinimumChange={setFireMinimum} />
        ) : <div className="environmental-timeline" role="status">
          {wildfires.status === "error" ? <>
            <p>No pudimos cargar los incendios.</p>
            <button type="button" onClick={wildfires.retry}>Volver a intentar</button>
          </> : "Cargando incendios…"}
        </div>}
        {timeline === "fires" && season && <details className="fire-map-legend">
          <summary>Cómo leer las llamas · CONAF</summary>
          <div>
            <strong>Incendios · {season.id.replace("-", "–")}</strong>
            <span>Una llama por comuna con al menos {fireMinimum} incendios en la temporada. Mayor tamaño = más incendios.</span>
            <span>Una comuna sin llama puede tener registros por debajo de este mínimo visual. Los conteos completos siguen en la tabla.</span>
            <span>Totales de julio a junio; posiciones simbólicas dentro de cada comuna.</span>
            <span>Sin coordenadas de los focos ni actividad en tiempo real.</span>
            <a href={`https://github.com/eziocard/DeHecho/tree/${fireData?.source.revision}/data/conaf`} target="_blank" rel="noreferrer">Fuente: conteos CONAF</a>
          </div>
        </details>}
        </>}
        territoryView={
          <section
            className="territory-section"
            aria-label="Exploración territorial"
          >
            <MapViewport selectedId={selectedId} onSelect={setSelectedId}
              fireSeason={timeline === "fires" ? season : null} fireMaximum={maximum} fireMinimum={fireMinimum} />
            <div className="map-caption">
              <span className="map-caption-dot" />
              <span>
                {selected ? (
                  <>
                    <strong>{selected.name}</strong> · {selected.province}
                  </>
                ) : (
                  "Selecciona una de las 32 comunas"
                )}
              </span>
              <span className="map-keyboard-hint">Flechas para explorar</span>
            </div>
          </section>
        }
        territoryId={selectedId ?? "09"}
        territoryName={selected?.name ?? "La Araucanía"}
        variable={navigation.variable}
        onVariableChange={setVariable}
        range={navigation.range}
        onRangeChange={setRange}
        compare={navigation.compare}
        onCompareChange={setCompare}
      />
    </main>
  );
}
