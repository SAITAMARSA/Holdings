import { AppData, SCHEMA_VERSION } from "@/domain/schema";
import { createEmptyData } from "@/domain/state";
import { CorruptDataError, type StorageAdapter } from "./adapter";

export type LoadStatus = "empty" | "ok" | "migrated" | "recovered";

export interface LoadResult {
  data: AppData;
  status: LoadStatus;
  /** Shown to the user when we had to recover from unreadable data. */
  notice?: string;
}

type Migration = (input: Record<string, unknown>) => Record<string, unknown>;

/**
 * Ordered migrations: MIGRATIONS[n] upgrades version n to n + 1. Add an entry
 * here whenever SCHEMA_VERSION changes. Unversioned data is treated as v0.
 */
const MIGRATIONS: Record<number, Migration> = {
  0: (d) => ({ ...d, version: 1 }),
};

export function migrate(input: unknown): { value: unknown; migrated: boolean } {
  if (typeof input !== "object" || input === null) return { value: input, migrated: false };
  let d = input as Record<string, unknown>;
  let v = typeof d.version === "number" ? d.version : 0;
  const start = v;
  while (v < SCHEMA_VERSION && MIGRATIONS[v]) {
    d = MIGRATIONS[v](d);
    v++;
  }
  return { value: d, migrated: v !== start };
}

/**
 * Validate stored data. If the whole document fails, try to salvage the
 * sections that are still valid (so one bad record doesn't wipe a user's
 * history); otherwise start fresh and keep a backup copy.
 */
export function parseStored(raw: unknown, mode: AppData["mode"]): LoadResult {
  if (raw == null) return { data: createEmptyData(mode), status: "empty" };
  const { value, migrated } = migrate(raw);
  const parsed = AppData.safeParse(value);
  if (parsed.success) {
    return { data: { ...parsed.data, mode }, status: migrated ? "migrated" : "ok" };
  }
  if (typeof value === "object" && value !== null && (value as { version?: unknown }).version === SCHEMA_VERSION) {
    const base = createEmptyData(mode) as Record<string, unknown>;
    const src = value as Record<string, unknown>;
    const shape = AppData.shape as Record<string, { safeParse: (v: unknown) => { success: boolean; data?: unknown } }>;
    let salvaged = 0;
    for (const key of Object.keys(shape)) {
      if (!(key in src)) continue;
      const r = shape[key].safeParse(src[key]);
      if (r.success) {
        base[key] = r.data;
        salvaged++;
      }
    }
    const candidate = AppData.safeParse({ ...base, mode });
    if (candidate.success && salvaged > 0) {
      // A profile without a plan (or vice versa) is unusable — re-onboard.
      const d = candidate.data;
      const consistent = d.onboarding.completed ? Boolean(d.profile && d.plan) : true;
      if (consistent) {
        return {
          data: d,
          status: "recovered",
          notice: "Some saved data couldn't be read and was reset. The rest of your data was kept.",
        };
      }
    }
  }
  return {
    data: createEmptyData(mode),
    status: "recovered",
    notice: "Your saved data couldn't be read, so Infit started fresh. A backup copy was kept in this browser.",
  };
}

export async function loadData(adapter: StorageAdapter, mode: AppData["mode"]): Promise<LoadResult> {
  let raw: unknown;
  try {
    raw = await adapter.load();
  } catch (e) {
    if (e instanceof CorruptDataError) {
      return {
        data: createEmptyData(mode),
        status: "recovered",
        notice: "Your saved data couldn't be read, so Infit started fresh. A backup copy was kept in this browser.",
      };
    }
    raw = null; // storage unavailable — behave like a fresh install
  }
  const result = parseStored(raw, mode);
  if (result.status === "recovered" && raw != null) {
    await adapter.backupCorrupt(JSON.stringify(raw));
  }
  return result;
}

export function exportJSON(data: AppData): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), app: "infit", data }, null, 2);
}
