export type ResourceSnapshot<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: Error };

const IDLE: ResourceSnapshot<never> = Object.freeze({ status: "idle" });
type Entry = {
  snapshot: ResourceSnapshot<unknown>;
  expiresAt: number;
  touched: number;
  controller?: AbortController;
  pending?: Promise<void>;
};

/** A bounded, observable cache. Concurrent readers share a request and its lifetime. */
export class ResourceCache {
  private readonly entries = new Map<string, Entry>();
  private readonly listeners = new Map<string, Set<() => void>>();
  private sequence = 0;
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly now: () => number;

  constructor(
    options: { ttlMs?: number; maxEntries?: number; now?: () => number } = {},
  ) {
    this.ttlMs = options.ttlMs ?? 120_000;
    this.maxEntries = options.maxEntries ?? 96;
    this.now = options.now ?? Date.now;
  }

  snapshot<T>(key: string | null): ResourceSnapshot<T> {
    return (
      key === null ? IDLE : (this.entries.get(key)?.snapshot ?? IDLE)
    ) as ResourceSnapshot<T>;
  }

  subscribe(key: string, listener: () => void): () => void {
    const subscribers = this.listeners.get(key) ?? new Set();
    subscribers.add(listener);
    this.listeners.set(key, subscribers);
    return () => {
      subscribers.delete(listener);
      if (subscribers.size) return;
      this.listeners.delete(key);
      // Strict Mode and rapid re-selection may immediately attach another reader.
      queueMicrotask(() => {
        const entry = this.entries.get(key);
        if (!this.listeners.has(key) && entry?.pending) {
          entry.controller?.abort();
          this.entries.delete(key);
        }
        this.prune();
      });
    };
  }

  load<T>(
    key: string,
    loader: (signal: AbortSignal) => Promise<T>,
    force = false,
  ): Promise<void> {
    const existing = this.entries.get(key);
    if (existing) {
      existing.touched = ++this.sequence;
      if (!force && existing.pending) return existing.pending;
      if (
        !force &&
        existing.snapshot.status === "ready" &&
        existing.expiresAt > this.now()
      )
        return Promise.resolve();
      existing.controller?.abort();
    }
    const controller = new AbortController();
    const entry: Entry = {
      snapshot: { status: "loading" },
      expiresAt: 0,
      touched: ++this.sequence,
      controller,
    };
    this.entries.set(key, entry);
    const current = () =>
      this.entries.get(key) === entry && !controller.signal.aborted;
    const pending = Promise.resolve()
      .then(() => {
        controller.signal.throwIfAborted();
        return loader(controller.signal);
      })
      .then(
        (data) => {
          if (!current()) return;
          entry.snapshot = { status: "ready", data };
          entry.expiresAt = this.now() + this.ttlMs;
        },
        (cause: unknown) => {
          if (!current()) return;
          entry.snapshot = {
            status: "error",
            error:
              cause instanceof Error
                ? cause
                : new Error("No pudimos cargar los datos."),
          };
        },
      )
      .finally(() => {
        if (this.entries.get(key) !== entry) return;
        entry.pending = undefined;
        entry.controller = undefined;
        this.emit(key);
        this.prune();
      });
    entry.pending = pending;
    this.emit(key);
    return pending;
  }

  private emit(key: string) {
    this.listeners.get(key)?.forEach((listener) => listener());
  }

  private prune() {
    if (this.entries.size <= this.maxEntries) return;
    const candidates = [...this.entries.entries()]
      .filter(([key, entry]) => !this.listeners.has(key) && !entry.pending)
      .sort((a, b) => a[1].touched - b[1].touched);
    for (const [key] of candidates) {
      if (this.entries.size <= this.maxEntries) break;
      this.entries.delete(key);
    }
  }
}
