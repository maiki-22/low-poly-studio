import { Vector3 } from "three";

// Original Blockbench generator's comunas.json (CIREN / IDE Minagri).
// The terrain was centered in EPSG:3857, scaled to width 160 and exported with
// north along -Z. Quantization is internal to the GLB, not to these coordinates.
export const TERRAIN_GEOGRAPHY = {
  crs: "EPSG:3857",
  bounds: [-8183965.17, -4813366.15, -7884428.11, -4520714.77],
  width: 160,
  source: "https://esri.ciren.cl/server/rest/services/IDEMINAGRI/LIMITES_ADMINISTRATIVOS_MINAGRI_1/MapServer/20",
} as const;

/** Geographic coordinates to the original GLB's coordinates, before framing. */
export function geographicTerrainPosition(longitude: number, latitude: number): Vector3 {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(longitude) > 180 || Math.abs(latitude) >= 85.051129) {
    throw new Error("Coordenadas fuera del rango de la proyección del terreno.");
  }
  const radius = 6378137;
  const east = radius * longitude * Math.PI / 180;
  const north = radius * Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360));
  const [west, south, eastBound, northBound] = TERRAIN_GEOGRAPHY.bounds;
  const scale = TERRAIN_GEOGRAPHY.width / (eastBound - west);
  return new Vector3(
    (east - (west + eastBound) / 2) * scale,
    0,
    -(north - (south + northBound) / 2) * scale,
  );
}
