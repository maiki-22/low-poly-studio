import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Import observed counts only. Regional months cannot locate municipal fires.
const root = resolve(process.argv[2] ?? ".local/DeHecho");
const communes = JSON.parse(await readFile("src/data/communes.json", "utf8"));
const normalize = (text) => text.normalize("NFD").replace(/[\u0300-\u036f\s]/g, "").toUpperCase();
const ids = new Map(communes.map((commune) => [normalize(commune.name), commune.id]));
const sources = [];
async function csv(path) {
  const bytes = await readFile(resolve(root, path));
  sources.push({ path, sha256: createHash("sha256").update(bytes).digest("hex") });
  const [header, ...lines] = bytes.toString("utf8").trim().split(/\r?\n/);
  const keys = header.replace(/^\uFEFF/, "").split(",");
  return lines.map((line) => {
    const cells = line.split(",");
    if (cells.length !== keys.length || line.includes('"')) throw new Error(`Unexpected CSV format: ${path}`);
    return Object.fromEntries(keys.map((key, index) => [key, cells[index]]));
  });
}
function count(text) {
  if (!text.trim()) return null;
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid count: ${text}`);
  return value;
}
const seasons = new Map();
for (const row of await csv("data/conaf/conaf_comuna.csv")) {
  const territoryId = ids.get(normalize(row.comuna));
  if (!territoryId || row.region !== "IX" || !/^\d{4}-\d{4}$/.test(row.temporada)) throw new Error(`Unknown territory/season: ${row.comuna}`);
  const year = Number(row.temporada.slice(0, 4));
  if (row.temporada !== `${year}-${year + 1}`) throw new Error("Invalid season bounds");
  if (!seasons.has(row.temporada)) seasons.set(row.temporada, {
    id: row.temporada, start: `${year}-07-01`, end: `${year + 1}-06-30`, counts: {},
  });
  const season = seasons.get(row.temporada);
  if (Object.hasOwn(season.counts, territoryId)) throw new Error("Duplicate municipal count");
  season.counts[territoryId] = count(row.numero_incendios);
}
const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
const seenMonths = new Set();
const months = (await csv("data/conaf/conaf.csv")).map((row) => {
  const month = monthNames.indexOf(row.mes) + 1;
  const year = Number(row.temporada.slice(0, 4)) + (month < 7 ? 1 : 0);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  if (!month || seenMonths.has(start)) throw new Error("Invalid/duplicate calendar month");
  seenMonths.add(start);
  return { start, value: count(row.IX), season: row.temporada };
}).sort((a, b) => a.start.localeCompare(b.start));
for (const season of seasons.values()) {
  if (Object.keys(season.counts).length !== 32) throw new Error(`Incomplete municipal coverage: ${season.id}`);
  const monthly = months.filter((point) => point.season === season.id);
  if (monthly.length !== 12) throw new Error(`Incomplete season: ${season.id}`);
  if (monthly.every((point) => point.value !== null) && Object.values(season.counts).every((value) => value !== null)) {
    const total = Object.values(season.counts).reduce((sum, value) => sum + value, 0);
    if (monthly.reduce((sum, point) => sum + point.value, 0) !== total) throw new Error(`Regional/municipal totals differ: ${season.id}`);
  }
}
const revision = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const output = {
  source: { name: "CONAF · DeHecho", repository: "https://github.com/eziocard/DeHecho", revision, files: sources },
  months, seasons: [...seasons.values()].sort((a, b) => a.start.localeCompare(b.start)),
};
await writeFile("src/data/wildfires.json", JSON.stringify(output, null, 2) + "\n");
console.log(`Imported ${months.length} regional months and ${seasons.size} municipal seasons from ${revision}.`);
