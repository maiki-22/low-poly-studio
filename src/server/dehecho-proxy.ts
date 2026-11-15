const QUERIES: Record<string, readonly string[]> = {
  catalogo: [],
  series: ["dataset", "variable", "territory_id", "start", "end"],
  tendencias: ["dataset", "variable", "territory_id"],
  asociaciones: ["dataset", "variable", "territory_id"],
  hallazgos: ["dataset", "variable", "territory_id"],
};
const error = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

/** Fixed resources and query parameters keep this from becoming an arbitrary proxy. */
export async function proxyDehecho(
  request: Request,
  resource: string,
  baseUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (!Object.hasOwn(QUERIES, resource))
    return error(404, "unknown_resource", "This query is unavailable.");
  const incoming = new URL(request.url).searchParams;
  if (
    [...incoming.keys()].some(
      (key) =>
        !QUERIES[resource].includes(key) || incoming.getAll(key).length > 1,
    )
  ) {
    return error(
      422,
      "invalid_parameters",
      "Invalid query parameters.",
    );
  }
  try {
    const origin = new URL(baseUrl);
    if (!["http:", "https:"].includes(origin.protocol))
      throw new Error("Invalid API origin");
    const target = new URL(
      `api/${resource}`,
      `${origin.toString().replace(/\/$/, "")}/`,
    );
    target.search = incoming.toString();
    const upstream = await fetcher(target, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
    });
    if (!upstream.headers.get("content-type")?.includes("application/json"))
      return error(
        502,
        "invalid_response",
        "We couldn’t read the response from the data service.",
      );
    return Response.json(await upstream.json(), {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (cause) {
    const timeout = cause instanceof Error && cause.name === "TimeoutError";
    return error(
      timeout ? 504 : 502,
      timeout ? "upstream_timeout" : "upstream_unavailable",
      "We couldn’t connect to the data service.",
    );
  }
}
