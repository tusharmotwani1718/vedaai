/**
 * A tiny bounded in-memory cache.
 *
 * The product runs without a database (see `specs/00_Technical_requirements.md`),
 * so every cache in this app is process-local and disappears on restart. The
 * bound exists purely so a long-running dev server cannot grow without limit.
 *
 * Eviction is least-recently-used: `Map` preserves insertion order, so
 * re-inserting an entry on read moves it to the end and the oldest key is
 * always the first one the iterator yields.
 */
export interface CacheStats {
  size: number;
  maxEntries: number;
  hits: number;
  misses: number;
}

export class MemoryCache<TValue> {
  readonly #entries = new Map<string, TValue>();
  readonly #maxEntries: number;

  #hits = 0;
  #misses = 0;

  constructor(maxEntries = 50) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new RangeError('maxEntries must be a positive integer');
    }
    this.#maxEntries = maxEntries;
  }

  get(key: string): TValue | undefined {
    if (!this.#entries.has(key)) {
      this.#misses += 1;
      return undefined;
    }

    // Non-null assertion is safe: `has` just confirmed the key is present, and
    // `undefined` is not a storable value for this cache's callers.
    const value = this.#entries.get(key)!;

    // Refresh recency.
    this.#entries.delete(key);
    this.#entries.set(key, value);

    this.#hits += 1;
    return value;
  }

  set(key: string, value: TValue): void {
    // Delete first so an overwrite also counts as "most recently used".
    this.#entries.delete(key);
    this.#entries.set(key, value);

    // delete the oldest key if the entries size extend the maxEntries allowed.
    while (this.#entries.size > this.#maxEntries) {
      const oldestKey = this.#entries.keys().next().value;
      if (oldestKey === undefined) break;
      this.#entries.delete(oldestKey);
    }
  }

  has(key: string): boolean {
    return this.#entries.has(key);
  }

  /** Drops a single entry. Returns whether anything was removed. */
  delete(key: string): boolean {
    return this.#entries.delete(key);
  }

  clear(): void {
    this.#entries.clear();
    this.#hits = 0;
    this.#misses = 0;
  }

  get stats(): CacheStats {
    return {
      size: this.#entries.size,
      maxEntries: this.#maxEntries,
      hits: this.#hits,
      misses: this.#misses,
    };
  }
}
