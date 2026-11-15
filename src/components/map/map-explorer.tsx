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
import { formatWildfireCount } from "@/features/environment/domain/wildfires";
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
        Skip to map
      </a>
      <a className="skip-link" href="#datos">
        Skip to data
      </a>
      <h1 className="sr-only">DeHecho: La Araucanía environmental explorer</h1>
      <header className="explorer-header">
        <Link className="brand" href="/" aria-label="Back to home">
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
          <small>Environmental explorer</small>
        </span>
      </Link>
      </header>
      <div className="territory-tools">
        <div className="territory-controls">
          <span className="control-label">Area</span>
          <TerritoryPicker
            value={selectedId ?? "09"}
            onChange={(id) => setSelectedId(id === "09" ? null : id)}
          />
          <span className="control-period">{timeline === "fires" ? "2014–2024" : "2014–2023"}</span>
          {selectedId && (
            <button
              type="button"
              aria-label="View the whole region"
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
        <div className="timeline-mode" role="group" aria-label="Timeline content">
          <button type="button" aria-pressed={timeline === "fires"} onClick={() => setTimeline("fires")}>Wildfire seasons</button>
          <button type="button" aria-pressed={timeline === "environment"} onClick={() => setTimeline("environment")}>Monthly climate</button>
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
              ? `${formatWildfireCount(monthlyFires.value)} recorded across the region this month`
              : "No regional wildfire count available for this month"}
          </p>}
        </> : fireData ? (
          <FireTimeline data={fireData} index={seasonIndex} onChange={setSeasonIndex} territoryId={navigation.territoryId}
            minimum={fireMinimum} onMinimumChange={setFireMinimum} />
        ) : <div className="environmental-timeline" role="status">
          {wildfires.status === "error" ? <>
            <p>We couldn’t load the wildfire counts.</p>
            <button type="button" onClick={wildfires.retry}>Try again</button>
          </> : "Loading wildfire counts…"}
        </div>}
        {timeline === "fires" && season && <details className="fire-map-legend">
          <summary>How to read the flames · CONAF</summary>
          <div>
            <strong>Wildfires · {season.id.replace("-", "–")}</strong>
            <span>One flame per municipality with at least {formatWildfireCount(fireMinimum)} that season. Larger flames mean higher counts.</span>
            <span>A municipality without a flame may have records below this display threshold. The table includes all counts.</span>
            <span>July–June totals, shown at symbolic locations within each municipality.</span>
            <span>These symbols show historical counts, without individual ignition coordinates or live incident information.</span>
            <a href={`https://github.com/eziocard/DeHecho/tree/${fireData?.source.revision}/data/conaf`} target="_blank" rel="noreferrer">Source: CONAF wildfire counts</a>
          </div>
        </details>}
        </>}
        territoryView={
          <section
            className="territory-section"
            aria-label="Regional map explorer"
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
                  "Select one of the 32 municipalities"
                )}
              </span>
              <span className="map-keyboard-hint">Use arrow keys to explore</span>
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
