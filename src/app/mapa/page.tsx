import type { Metadata } from "next";
import MapExplorer from "@/components/map/map-explorer";

export const metadata: Metadata = {
  title: "La Araucanía Environmental Explorer — DeHecho",
};

export default function MapaPage() {
  return <MapExplorer />;
}
