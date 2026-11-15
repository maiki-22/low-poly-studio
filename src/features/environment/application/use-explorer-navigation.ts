"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import communes from "@/data/communes.json";
import {
  parseExplorerSelection,
  writeExplorerSelection,
  type ExplorerSelection,
} from "./explorer-navigation";

const territoryIds = new Set(communes.map((commune) => commune.id));
const eventName = "dehecho:navigate";
const serverSearch = () => "";
const browserSearch = () => window.location.search;
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(eventName, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(eventName, listener);
  };
}

export function useExplorerNavigation() {
  const search = useSyncExternalStore(subscribe, browserSearch, serverSearch);
  const selection = useMemo(
    () => parseExplorerSelection(search, territoryIds),
    [search],
  );
  const update = useCallback((patch: Partial<ExplorerSelection>) => {
    const current = parseExplorerSelection(
      window.location.search,
      territoryIds,
    );
    const url = new URL(window.location.href);
    url.search = writeExplorerSelection(url.search, { ...current, ...patch });
    if (url.href === window.location.href) return;
    window.history.pushState(null, "", url);
    window.dispatchEvent(new Event(eventName));
  }, []);
  return { ...selection, update };
}
