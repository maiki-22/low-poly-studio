import type { Metadata } from "next";
import MapExplorer from "@/components/map/map-explorer";

export const metadata: Metadata = {
  title: "Explorador ambiental de La Araucanía — DeHecho",
};

export default function MapaPage() {
  return <MapExplorer />;
}
