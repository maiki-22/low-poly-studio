"use client";

import { useRemoteResource } from "@/hooks/use-remote-resource";
import { decodeWildfires } from "../domain/wildfires";

async function loadWildfires(signal: AbortSignal) {
  const response = await fetch("/api/incendios", { signal });
  if (!response.ok) throw new Error("We couldn’t load the wildfire counts.");
  return decodeWildfires(await response.json());
}

export function useWildfires() {
  return useRemoteResource("wildfires:conaf", loadWildfires);
}
