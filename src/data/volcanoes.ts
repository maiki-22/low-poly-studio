/** EPSG:4326 positions from the SERNAGEOMIN inventory published by the MMA.
 * The anchor is the mesh under the point in this simplified terrain, rather
 * than an exhaustive statement about the municipalities crossed by a volcano.
 */
export const VOLCANO_LOCATION_SOURCE =
  "https://lineasdebasepublicas.mma.gob.cl/datos_abiertos/dataset/inventario-de-volcanes-activos";

export const VOLCANOES = [
  { id: "villarrica", name: "Villarrica", longitude: -71.939, latitude: -39.420, anchorCommuneId: "09115" },
  { id: "llaima", name: "Llaima", longitude: -71.733, latitude: -38.694, anchorCommuneId: "09119" },
  { id: "lonquimay", name: "Lonquimay", longitude: -71.589, latitude: -38.379, anchorCommuneId: "09203" },
] as const;
