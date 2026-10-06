"use client";

import { useEffect, useState } from "react";
import { todayISO } from "@/domain/dates";

/**
 * Current time that re-renders on an interval and immediately when the tab
 * becomes visible again (timers are computed from timestamps, so returning
 * from the background shows the correct value right away).
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, intervalMs);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
    };
  }, [intervalMs]);
  return now;
}

/** Today's local date, refreshed every minute (handles midnight rollover). */
export function useToday(): string {
  return todayISO(new Date(useNow(60_000)));
}
