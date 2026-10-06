/**
 * Persistence abstraction. The prototype uses LocalStorageAdapter; an
 * authenticated backend can implement the same interface (e.g. an
 * ApiStorageAdapter that GETs/PUTs /api/me/data) without touching the UI or
 * domain code. Adapters store opaque JSON — validation happens in repository.ts.
 */
export interface StorageAdapter {
  /** Human-readable description shown in Settings. */
  readonly description: string;
  /** Returns null when nothing is stored; throws CorruptDataError if unreadable. */
  load(): Promise<unknown | null>;
  save(data: unknown): Promise<void>;
  clear(): Promise<void>;
  /** Keep a copy of unreadable data instead of silently destroying it. */
  backupCorrupt(raw: string): Promise<void>;
}

/** Thrown by load() when stored data exists but can't be parsed. */
export class CorruptDataError extends Error {
  constructor() {
    super("Stored data could not be parsed");
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  readonly description = "Stored only in this browser on this device. Not synced to an account.";

  constructor(private readonly key: string) {}

  private get storage(): Storage | null {
    try {
      return typeof window !== "undefined" ? window.localStorage : null;
    } catch {
      return null; // e.g. storage disabled by privacy settings
    }
  }

  async load(): Promise<unknown | null> {
    const raw = this.storage?.getItem(this.key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      await this.backupCorrupt(raw);
      throw new CorruptDataError();
    }
  }

  async save(data: unknown): Promise<void> {
    this.storage?.setItem(this.key, JSON.stringify(data));
  }

  async clear(): Promise<void> {
    this.storage?.removeItem(this.key);
  }

  async backupCorrupt(raw: string): Promise<void> {
    try {
      this.storage?.setItem(`${this.key}:corrupt-backup`, raw);
    } catch {
      /* quota exceeded — nothing more we can do */
    }
  }
}

/** In-memory adapter for tests and environments without storage. */
export class MemoryAdapter implements StorageAdapter {
  readonly description = "Stored in memory only.";
  value: unknown | null = null;
  corrupt: string | null = null;
  async load() {
    return this.value;
  }
  async save(data: unknown) {
    this.value = JSON.parse(JSON.stringify(data));
  }
  async clear() {
    this.value = null;
  }
  async backupCorrupt(raw: string) {
    this.corrupt = raw;
  }
}

/** Real user data and demo data never share a storage key. */
export const STORAGE_KEYS = {
  user: "infit:user:v1",
  demo: "infit:demo:v1",
  mode: "infit:active-mode",
} as const;
