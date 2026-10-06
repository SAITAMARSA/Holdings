import { startOfWeek } from "./dates";
import { weekSummary } from "./progress";
import type { AppData, CompletedSession, RewardEvent } from "./schema";
import { uid } from "./uid";

/**
 * Cosmetic Twin points. These are deliberately separate from fitness
 * progress and are awarded through an idempotent ledger: every award has a
 * unique key, so finishing, undoing or repeating actions can never earn the
 * same reward twice. Nothing is ever deducted.
 */

export const POINTS = {
  complete: 10,
  partial: 5,
  comeback: 15,
  weekly: 20,
  first: 10,
} as const;

export const POINT_RULES: { label: string; points: number; detail: string }[] = [
  { label: "Finish a planned session", points: POINTS.complete, detail: "Including a shortened or adjusted version you agreed to." },
  { label: "Partly finish a session", points: POINTS.partial, detail: "Every set you complete counts. Finish later that day to top up." },
  { label: "Complete this week's plan", points: POINTS.weekly, detail: "Train on every day you planned. Rest days don't count against you." },
  { label: "Come back after a break", points: POINTS.comeback, detail: "Returning after 10+ days is worth celebrating." },
  { label: "Your first session", points: POINTS.first, detail: "A one-time welcome bonus." },
];

export function totalPoints(data: Pick<AppData, "rewards">): number {
  return data.rewards.reduce((n, r) => n + r.points, 0);
}

function award(data: AppData, event: Omit<RewardEvent, "id" | "createdAt">, now: number): AppData {
  if (event.points <= 0 || data.rewards.some((r) => r.key === event.key)) return data;
  return { ...data, rewards: [...data.rewards, { ...event, id: uid("rw"), createdAt: now }] };
}

const has = (data: AppData, key: string) => data.rewards.some((r) => r.key === key);

export function applyRewardsForSession(data: AppData, s: CompletedSession, now: number): AppData {
  let next = data;
  const date = s.date;

  next = award(next, { key: "first-session", kind: "first-session", points: POINTS.first, label: "First session", date }, now);

  // One session reward per calendar day. A full session after a partial one
  // tops up the difference; a partial after a full session earns nothing.
  if (s.status === "completed") {
    const already = has(next, `session:${date}:partial`) ? POINTS.partial : 0;
    next = award(
      next,
      {
        key: `session:${date}:complete`,
        kind: "session-complete",
        points: POINTS.complete - already,
        label: already ? "Finished the session (top-up)" : `Finished ${s.name}`,
        date,
      },
      now,
    );
  } else if (!has(next, `session:${date}:complete`)) {
    next = award(
      next,
      {
        key: `session:${date}:partial`,
        kind: "session-partial",
        points: POINTS.partial,
        label: `Partly finished ${s.name} (${s.completedSets}/${s.plannedSets} sets)`,
        date,
      },
      now,
    );
  }

  if (s.isReturn) {
    next = award(next, { key: `comeback:${date}`, kind: "comeback", points: POINTS.comeback, label: "Welcome back!", date }, now);
  }

  const week = weekSummary(next, date, date);
  if (week.goalMet) {
    next = award(
      next,
      {
        key: `week:${startOfWeek(date)}`,
        kind: "weekly-goal",
        points: POINTS.weekly,
        label: "Completed this week's plan",
        date,
      },
      now,
    );
  }
  return next;
}

// ---------------------------------------------------------------- accessories

export interface Accessory {
  id: string;
  name: string;
  /** Lifetime points needed. Unlocks are permanent. */
  unlockAt: number;
}

export const ACCESSORIES: Accessory[] = [
  { id: "sunglasses", name: "Cool shades", unlockAt: 20 },
  { id: "bottle", name: "Water bottle", unlockAt: 40 },
  { id: "sneakers", name: "Bright sneakers", unlockAt: 70 },
  { id: "cap", name: "Sport cap", unlockAt: 100 },
  { id: "cape", name: "Hero cape", unlockAt: 150 },
];

export function unlockedAccessories(data: Pick<AppData, "rewards">): Set<string> {
  const pts = totalPoints(data);
  return new Set(ACCESSORIES.filter((a) => pts >= a.unlockAt).map((a) => a.id));
}
