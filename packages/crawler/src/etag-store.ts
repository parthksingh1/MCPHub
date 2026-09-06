import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Persists ETags between crawler runs.
 *
 * GitHub does not count a conditional request that returns 304 against the
 * hourly rate limit. With ~500 servers refreshed daily, that is the difference
 * between comfortably fitting in the budget and exhausting it before finishing.
 */
export interface EtagStore {
  get(key: string): Promise<string | undefined>;
  set(key: string, etag: string): Promise<void>;
  /** Flushes any buffered writes. A no-op for stores that write eagerly. */
  flush(): Promise<void>;
}

/** In-memory store. Useful for tests and one-shot runs. */
export class MemoryEtagStore implements EtagStore {
  private readonly entries = new Map<string, string>();

  /** Returns the stored ETag for a request key, if any. */
  async get(key: string): Promise<string | undefined> {
    return this.entries.get(key);
  }

  /** Records the ETag for a request key. */
  async set(key: string, etag: string): Promise<void> {
    this.entries.set(key, etag);
  }

  /** No-op: this store has nothing to flush. */
  async flush(): Promise<void> {
    // Intentionally empty.
  }
}

/**
 * JSON-file-backed store, designed to be restored and saved by
 * `actions/cache` between scheduled GitHub Actions runs.
 *
 * Loads lazily and writes once at the end, so a run makes exactly one read and
 * one write regardless of how many repositories it touches.
 */
export class FileEtagStore implements EtagStore {
  private entries: Map<string, string> | undefined;
  private dirty = false;

  constructor(private readonly path: string) {}

  /** Reads the cache file into memory on first use. */
  private async load(): Promise<Map<string, string>> {
    if (this.entries) return this.entries;

    try {
      const raw = await readFile(this.path, 'utf8');
      const parsed: unknown = JSON.parse(raw);

      this.entries =
        parsed && typeof parsed === 'object'
          ? new Map(Object.entries(parsed as Record<string, string>))
          : new Map();
    } catch {
      // A missing or corrupt cache is not an error — it just means every
      // request this run is unconditional.
      this.entries = new Map();
    }

    return this.entries;
  }

  /** Returns the stored ETag for a request key, if any. */
  async get(key: string): Promise<string | undefined> {
    return (await this.load()).get(key);
  }

  /** Records the ETag for a request key, marking the store dirty. */
  async set(key: string, etag: string): Promise<void> {
    (await this.load()).set(key, etag);
    this.dirty = true;
  }

  /** Writes the cache back to disk, if anything changed. */
  async flush(): Promise<void> {
    if (!this.dirty || !this.entries) return;

    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(Object.fromEntries(this.entries)), 'utf8');
    this.dirty = false;
  }
}
