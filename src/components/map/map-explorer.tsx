"use client";

import Link from "next/link";
import Image from "next/image";
import { TerritoryPicker } from "./territory-picker";
import { useCallback } from "react";
import { useExplorerNavigation } from "@/features/environment/application/use-explorer-navigation";
import type { VariableId } from "@/features/environment/domain/environment";
import type { ChartRange } from "@/features/environment/application/chart-data";
import communes from "@/data/communes.json";
import { MapViewport } from "./map-viewport";
import { EnvironmentalPanel } from "@/features/environment/components/environmental-panel";
import { Icon } from "@/components/ui/icon";
import { IoArrowBackOutline } from "react-icons/io5";

export default function MapExplorer() {
  const navigation = useExplorerNavigation();
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
      <div className="territory-controls">
        <span className="control-label">Territorio</span>
        <TerritoryPicker
          value={selectedId ?? "09"}
          onChange={(id) => setSelectedId(id === "09" ? null : id)}
        />
        <span className="control-period">2014–2023</span>
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
      <EnvironmentalPanel
        territoryView={
          <section
            className="territory-section"
            aria-label="Exploración territorial"
          >
            <MapViewport selectedId={selectedId} onSelect={setSelectedId} />
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
