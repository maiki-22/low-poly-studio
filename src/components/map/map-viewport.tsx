"use client";

import dynamic from "next/dynamic";
import { Component, memo, useCallback, useState, type ReactNode } from "react";
import communes from "@/data/communes.json";
import type { HoveredCommune } from "./types";
import type { FireSeason } from "@/features/environment/domain/wildfires";
import { formatNumber } from "@/features/environment/domain/environment";

const MapScene = dynamic(() => import("./map-scene"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" role="status">
      Preparando el mapa…
    </div>
  ),
});

class MapErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="map-loading map-error" role="alert">
          <strong>No pudimos cargar el mapa 3D.</strong>
          <button onClick={() => window.location.reload()}>
            Volver a intentar
          </button>
        </div>
      );
    return this.props.children;
  }
}

export const MapViewport = memo(function MapViewport({
  selectedId,
  onSelect,
  fireSeason,
  fireMaximum,
  fireMinimum,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  fireSeason: FireSeason | null;
  fireMaximum: number;
  fireMinimum: number;
}) {
  const [hoverState, setHoverState] = useState<{
    selectionId: string | null;
    point: HoveredCommune;
  } | null>(null);
  const hovered =
    hoverState?.selectionId === selectedId ? hoverState.point : null;
  const selected = communes.find((commune) => commune.id === selectedId);
  const hoveredCommune = communes.find((commune) => commune.id === hovered?.id);
  const hover = useCallback(
    (point: HoveredCommune | null) =>
      setHoverState(point ? { selectionId: selectedId, point } : null),
    [selectedId],
  );
  const select = useCallback(
    (id: string | null) => {
      onSelect(id);
      setHoverState(null);
    },
    [onSelect],
  );
  return (
    <div
      role="group"
      className="map-stage"
      id="mapa"
      tabIndex={0}
      aria-label="Mapa interactivo de La Araucanía"
      aria-describedby="map-instructions"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onSelect(null);
          setHoverState(null);
        }
        if (
          ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(
            event.key,
          )
        ) {
          event.preventDefault();
          const direction = ["ArrowRight", "ArrowDown"].includes(event.key)
            ? 1
            : -1;
          const currentIndex = communes.findIndex(
            (commune) => commune.id === selectedId,
          );
          const nextIndex =
            currentIndex < 0
              ? direction > 0
                ? 0
                : communes.length - 1
              : (currentIndex + direction + communes.length) % communes.length;
          onSelect(communes[nextIndex].id);
          setHoverState(null);
        }
      }}
    >
      <p id="map-instructions" className="sr-only">
        Haz clic en una comuna para seleccionarla y en el fondo para limpiar la
        selección. Con el teclado, usa las flechas para seleccionar comunas y
        Escape para limpiar.
      </p>
      <MapErrorBoundary>
        <MapScene
          selectedId={selectedId}
          hoveredId={hovered?.id ?? null}
          onSelect={select}
          onHover={hover}
          fireCounts={fireSeason?.counts ?? null}
          fireMaximum={fireMaximum}
          fireMinimum={fireMinimum}
        />
      </MapErrorBoundary>
      {hovered && hoveredCommune && (
        <div
          className="map-tooltip"
          style={{ left: hovered.x, top: hovered.y }}
          aria-hidden="true"
        >
          {hoveredCommune.name}
          <span>{hoveredCommune.province}</span>
          {fireSeason && <span>{fireSeason.counts[hoveredCommune.id] == null ? "Sin datos" : `${formatNumber(fireSeason.counts[hoveredCommune.id]!, 0)} incendios`} · {fireSeason.id}</span>}
        </div>
      )}
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {selected
          ? `${selected.name}, provincia de ${selected.province}. Comuna seleccionada.`
          : "La Araucanía. Vista regional seleccionada."}
      </p>
    </div>
  );
});
