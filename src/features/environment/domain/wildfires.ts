import { formatNumber } from "./environment.ts";

export function formatWildfireCount(count: number): string {
  return `${formatNumber(count, 0)} ${count === 1 ? "wildfire" : "wildfires"}`;
}

export type FireSeason = {
  id: string;
  start: string;
  end: string;
  counts: Record<string, number | null>;
};

export type WildfireData = {
  source: { name: string; repository: string; revision: string };
  months: { start: string; value: number | null; season: string }[];
  seasons: FireSeason[];
};

/** A missing count is never interpreted as no fires. */
export function seasonCount(season: FireSeason, territoryId: string): number | null {
  if (territoryId !== "09") return season.counts[territoryId] ?? null;
  const counts = Object.values(season.counts);
  if (counts.length !== 32 || counts.some((count) => count === null)) return null;
  return counts.reduce<number>((sum, count) => sum + count!, 0);
}

export function decodeWildfires(value: unknown): WildfireData {
  const invalid = () => new Error("We couldn’t read the wildfire counts.");
  if (!value || typeof value !== "object") throw invalid();
  const data = value as WildfireData;
  const validCount = (count: unknown) => count === null || (typeof count === "number" && Number.isSafeInteger(count) && count >= 0);
  if (!data.source || typeof data.source.name !== "string" ||
      typeof data.source.repository !== "string" || typeof data.source.revision !== "string" ||
      !Array.isArray(data.seasons) || !Array.isArray(data.months)) throw invalid();
  const ids = new Set<string>();
  for (const season of data.seasons) {
    if (!season || typeof season.id !== "string" || !/^\d{4}-\d{4}$/.test(season.id) || ids.has(season.id)) throw invalid();
    ids.add(season.id);
    const year = Number(season.id.slice(0, 4));
    if (season.id !== `${year}-${year + 1}` || season.start !== `${year}-07-01` || season.end !== `${year + 1}-06-30` ||
        !season.counts || Object.keys(season.counts).length !== 32 ||
        Object.entries(season.counts).some(([id, count]) => !/^09\d{3}$/.test(id) || !validCount(count))) throw invalid();
  }
  const months = new Set<string>();
  for (const point of data.months) {
    if (!point || typeof point.start !== "string" || !/^\d{4}-(0[1-9]|1[0-2])-01$/.test(point.start) ||
        months.has(point.start) || !validCount(point.value) || !ids.has(point.season)) throw invalid();
    months.add(point.start);
  }
  return data;
}
