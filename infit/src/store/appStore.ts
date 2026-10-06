"use client";

import { create } from "zustand";
import { todayISO } from "@/domain/dates";
import { createDemoData } from "@/domain/demo";
import type { AppData } from "@/domain/schema";
import { createEmptyData } from "@/domain/state";
import { LocalStorageAdapter, STORAGE_KEYS, type StorageAdapter } from "@/storage/adapter";
import { loadData } from "@/storage/repository";

/**
 * Client store. Domain logic stays in pure functions (src/domain); the store
 * only holds the current AppData, applies updates and persists them through
 * the StorageAdapter. Swapping LocalStorageAdapter for a backend adapter is
 * the path to authenticated sync.
 */

type Mode = AppData["mode"];

function adapterFor(mode: Mode): StorageAdapter {
  return new LocalStorageAdapter(mode === "demo" ? STORAGE_KEYS.demo : STORAGE_KEYS.user);
}

function readActiveMode(): Mode {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.mode) === "demo" ? "demo" : "user";
  } catch {
    return "user";
  }
}

function writeActiveMode(mode: Mode) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.mode, mode);
  } catch {
    /* storage unavailable */
  }
}

export interface AppStore {
  status: "loading" | "ready";
  data: AppData;
  notice: string | null;
  storageDescription: string;
  hydrate(): Promise<void>;
  /** Apply a pure domain transformation and persist the result. */
  update(fn: (d: AppData) => AppData): void;
  enterDemo(): Promise<void>;
  exitDemo(): Promise<void>;
  resetCurrent(): Promise<void>;
  dismissNotice(): void;
}

let adapter: StorageAdapter | null = null;

export const useAppStore = create<AppStore>((set, get) => ({
  status: "loading",
  data: createEmptyData(),
  notice: null,
  storageDescription: "",

  async hydrate() {
    const mode = readActiveMode();
    adapter = adapterFor(mode);
    const result = await loadData(adapter, mode);
    let data = result.data;
    if (mode === "demo" && result.status === "empty") {
      data = createDemoData(Date.now());
      await adapter.save(data);
    }
    set({ status: "ready", data, notice: result.notice ?? null, storageDescription: adapter.description });
  },

  update(fn) {
    const next = fn(get().data);
    if (next === get().data) return;
    set({ data: next });
    adapter?.save(next).catch(() => set({ notice: "Couldn't save to this browser's storage. Is it full or disabled?" }));
  },

  async enterDemo() {
    writeActiveMode("demo");
    adapter = adapterFor("demo");
    // Always start the demo fresh so it reflects today's date.
    const data = createDemoData(Date.now());
    await adapter.save(data);
    set({ data, status: "ready", notice: null });
  },

  async exitDemo() {
    await adapterFor("demo").clear();
    writeActiveMode("user");
    adapter = adapterFor("user");
    const result = await loadData(adapter, "user");
    set({ data: result.data, status: "ready", notice: result.notice ?? null });
  },

  async resetCurrent() {
    const mode = get().data.mode;
    await adapter?.clear();
    const data = mode === "demo" ? createDemoData(Date.now()) : createEmptyData("user");
    if (mode === "demo") await adapter?.save(data);
    set({ data, notice: null });
  },

  dismissNotice() {
    set({ notice: null });
  },
}));

export const now = () => Date.now();
export const today = () => todayISO(new Date());
