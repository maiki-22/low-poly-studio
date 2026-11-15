import assert from "node:assert/strict";
import { test } from "node:test";
import { ResourceCache } from "../src/lib/resource-cache.ts";
import { repositoryCache } from "../src/features/environment/application/repository-cache.ts";

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const tick = () => new Promise((resolve) => queueMicrotask(resolve));

test("warm reads are synchronous, retain snapshot identity and respect expiration on activation", async () => {
  let time = 0,
    requests = 0;
  const cache = new ResourceCache({ ttlMs: 100, now: () => time });
  const loader = async () => ++requests;
  assert.strictEqual(cache.snapshot("new"), cache.snapshot(null));
  await cache.load("a", loader);
  const first = cache.snapshot("a");
  assert.strictEqual(first, cache.snapshot("a"));
  await cache.load("a", loader);
  assert.equal(requests, 1);
  time = 101;
  assert.strictEqual(
    cache.snapshot("a"),
    first,
    "an active view does not disappear when time passes",
  );
  await cache.load("a", loader);
  assert.equal(requests, 2);
  assert.deepEqual(cache.snapshot("a"), { status: "ready", data: 2 });
});

test("concurrent consumers share one request and only the last unsubscribe cancels it", async () => {
  const cache = new ResourceCache();
  const source = deferred();
  let requests = 0,
    signal;
  const loader = (input) => {
    requests++;
    signal = input;
    return source.promise;
  };
  const off1 = cache.subscribe("region", () => {});
  const off2 = cache.subscribe("region", () => {});
  const first = cache.load("region", loader);
  assert.strictEqual(cache.load("region", loader), first);
  await tick();
  off1();
  await tick();
  assert.equal(signal.aborted, false);
  off2();
  await tick();
  assert.equal(signal.aborted, true);
  source.resolve("obsolete");
  await first;
  assert.equal(requests, 1);
  assert.equal(cache.snapshot("region").status, "idle");
});

test("a replacement request cannot be overwritten by a late response", async () => {
  const cache = new ResourceCache();
  const old = deferred();
  const first = cache.load("a", () => old.promise);
  await tick();
  await cache.load("a", async () => "new", true);
  old.resolve("old");
  await first;
  assert.deepEqual(cache.snapshot("a"), { status: "ready", data: "new" });
});

test("cache is bounded and evicts inactive least recently used results", async () => {
  const cache = new ResourceCache({ maxEntries: 2 });
  await cache.load("a", async () => 1);
  await cache.load("b", async () => 2);
  await cache.load("a", async () => 99);
  await cache.load("c", async () => 3);
  assert.equal(cache.snapshot("b").status, "idle");
  assert.equal(cache.snapshot("a").data, 1);
  assert.equal(cache.snapshot("c").data, 3);
});

test("failed loads can be retried and repositories never share data", async () => {
  const cache = new ResourceCache();
  await cache.load("a", async () => {
    throw new Error("offline");
  });
  assert.equal(cache.snapshot("a").status, "error");
  await cache.load("a", async () => 42);
  assert.equal(cache.snapshot("a").data, 42);
  const first = {},
    second = {};
  assert.strictEqual(repositoryCache(first), repositoryCache(first));
  await repositoryCache(first).load("a", async () => "first source");
  assert.equal(repositoryCache(second).snapshot("a").status, "idle");
});
