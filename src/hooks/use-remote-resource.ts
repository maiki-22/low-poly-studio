"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { ResourceCache } from "@/lib/resource-cache";

const defaultCache = new ResourceCache();
const noop = () => {};

/** Selection identity is checked during render, so an old response is never shown under a new title. */
export function useRemoteResource<T>(
  key: string | null,
  load: (signal: AbortSignal) => Promise<T>,
  cache: ResourceCache = defaultCache,
) {
  const subscribe = useCallback(
    (listener: () => void) =>
      key === null ? noop : cache.subscribe(key, listener),
    [cache, key],
  );
  const getSnapshot = useCallback(() => cache.snapshot<T>(key), [cache, key]);
  const getServerSnapshot = useCallback(() => cache.snapshot<T>(null), [cache]);
  const result = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  useEffect(() => {
    if (key === null) return;
    void cache.load(key, load);
  }, [cache, key, load]);
  const retry = useCallback(() => {
    if (key !== null) void cache.load(key, load, true);
  }, [cache, key, load]);
  return { ...result, retry };
}
