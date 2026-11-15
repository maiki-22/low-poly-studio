import wildfires from "@/data/wildfires.json";

// The upstream API has no count endpoint yet. Serve a traceable CONAF snapshot;
// this is independent of the live environmental proxy and never a fallback.
export function GET() {
  return Response.json(wildfires);
}
