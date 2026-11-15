import { ResourceCache } from "../../../lib/resource-cache.ts";
import type { EnvironmentRepository } from "../domain/environment.ts";

const caches = new WeakMap<EnvironmentRepository, ResourceCache>();

/** Injected repositories never share entries, even when their resource keys match. */
export function repositoryCache(
  repository: EnvironmentRepository,
): ResourceCache {
  let cache = caches.get(repository);
  if (!cache) {
    cache = new ResourceCache();
    caches.set(repository, cache);
  }
  return cache;
}
