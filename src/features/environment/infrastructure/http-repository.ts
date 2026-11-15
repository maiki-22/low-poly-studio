import {
  REGION_ID,
  type EnvironmentRepository,
  type SeriesSelection,
} from "../domain/environment.ts";
import {
  decodeAssociations,
  decodeCatalog,
  decodeFindings,
  decodeSeries,
  decodeTrends,
} from "./decoders.ts";

type Fetcher = typeof fetch;
export class DataRequestError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(
      status === 503 || status === 502 || status === 504
        ? "Estos datos no están disponibles en este momento."
        : "No pudimos consultar los datos seleccionados.",
    );
    this.status = status;
  }
}

export function createHttpEnvironmentRepository(
  fetcher: Fetcher = fetch,
): EnvironmentRepository {
  async function request<T>(
    resource: string,
    params: Record<string, string>,
    decode: (value: unknown) => T,
    signal: AbortSignal,
  ): Promise<T> {
    const query = new URLSearchParams(params);
    const response = await fetcher(`/api/dehecho/${resource}?${query}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new DataRequestError(response.status);
    return decode(await response.json());
  }
  const selectors = (selection: SeriesSelection) => ({
    variable: selection.variable,
    territory_id: selection.territoryId,
  });
  return {
    catalog: (signal) => request("catalogo", {}, decodeCatalog, signal),
    async series(selection, signal) {
      const data = await request(
        "series",
        {
          dataset:
            selection.territoryId === REGION_ID
              ? "ambiente_region"
              : "ambiente_comunas",
          ...selectors(selection),
        },
        decodeSeries,
        signal,
      );
      return (
        data.find(
          (row) =>
            row.variable === selection.variable &&
            row.territoryId === selection.territoryId,
        ) ?? null
      );
    },
    async trend(selection, signal) {
      const data = await request(
        "tendencias",
        { dataset: "tendencias_ambientales", ...selectors(selection) },
        decodeTrends,
        signal,
      );
      return (
        data.find(
          (row) =>
            row.variable === selection.variable &&
            row.territoryId === selection.territoryId,
        ) ?? null
      );
    },
    async fireContext(variable, signal) {
      const [associations, findings] = await Promise.all([
        request(
          "asociaciones",
          { dataset: "asociaciones_conaf", variable, territory_id: REGION_ID },
          decodeAssociations,
          signal,
        ),
        request(
          "hallazgos",
          { dataset: "hallazgos_conaf", variable, territory_id: REGION_ID },
          decodeFindings,
          signal,
        ),
      ]);
      return {
        association:
          associations.find((row) => row.variable === variable) ?? null,
        findings,
      };
    },
  };
}

export const environmentRepository = createHttpEnvironmentRepository();
