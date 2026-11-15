"use client";

import dynamic from "next/dynamic";
import { Component, memo, useCallback, useState, type ReactNode } from "react";
import communes from "@/data/communes.json";
import { VOLCANOES } from "@/data/volcanoes";
import type { HoveredCommune } from "./types";
import { formatWildfireCount, type FireSeason } from "@/features/environment/domain/wildfires";

const MapScene = dynamic(() => import("./map-scene"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" role="status">
      Preparing the map…
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
          <strong>We couldn’t load the 3D map.</strong>
          <button onClick={() => window.location.reload()}>
            Try again
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
  const hoveredVolcano = VOLCANOES.find((volcano) => volcano.anchorCommuneId === hovered?.id);
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
      aria-label="Interactive map of La Araucanía"
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
        Click a municipality to select it, or click the background to clear the
        selection. Use the arrow keys to select municipalities and
        Escape to clear the selection.
        The map includes representations of Villarrica, Llaima and Lonquimay volcanoes.
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
          {hoveredVolcano && <span>{hoveredVolcano.name} volcano</span>}
          {fireSeason && <span>{fireSeason.counts[hoveredCommune.id] == null ? "No data" : formatWildfireCount(fireSeason.counts[hoveredCommune.id]!)} · {fireSeason.id}</span>}
        </div>
      )}
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {selected
          ? `${selected.name}, ${selected.province} Province. Municipality selected.`
          : "La Araucanía. Regional view selected."}
      </p>
    </div>
  );
});
