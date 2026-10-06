import { type ISODate } from "./dates";
import { plannedSessionFor } from "./plan";
import { daysSinceLastSession } from "./progress";
import type { AppData, CheckInKind, CheckInRecord } from "./schema";
import { RETURN_GAP_DAYS } from "./session";
import { addMemory, regeneratePlan } from "./state";

/**
 * Occasional, contextual questions. Rules:
 * - At most one at a time, and none within a day of the last answer.
 * - "Later" snoozes for 3 days; answered questions cool down for weeks.
 * - Streak-based questions only re-trigger on data newer than the last answer.
 * - Accepting applies a single, clearly described change. Nothing is applied
 *   silently, and nothing sensitive is inferred.
 */

const DAY = 86_400_000;
export const GLOBAL_COOLDOWN_MS = DAY;
export const SNOOZE_MS = 3 * DAY;
export const COOLDOWN_MS: Record<"accepted" | "dismissed", number> = {
  accepted: 30 * DAY,
  dismissed: 21 * DAY,
};

export interface CheckIn {
  kind: CheckInKind;
  question: string;
  detail: string;
  acceptLabel: string;
  /** Either a navigation or a data change applied on accept. */
  effect: { type: "navigate"; href: string } | { type: "apply" };
}

function eligible(rec: CheckInRecord | undefined, now: number, latestDataAt: number | null): boolean {
  if (!rec) return true;
  if (rec.snoozedUntil && rec.snoozedUntil > now) return false;
  if (rec.resolvedAt && rec.resolution) {
    if (now - rec.resolvedAt < COOLDOWN_MS[rec.resolution]) return false;
    if (latestDataAt !== null && latestDataAt <= rec.resolvedAt) return false;
  }
  return true;
}

/** Suggested session length: the longer of the two, rounded up to 5 minutes. */
function suggestedMinutes(shortened: number[]): number {
  return Math.ceil(Math.max(...shortened) / 5) * 5;
}

function shortenedMinutes(data: AppData): number[] | null {
  const recent = data.sessions.slice(-2);
  if (recent.length < 2) return null;
  const minutes: number[] = [];
  for (const s of recent) {
    const rev = data.revisions.find((r) => r.id === s.revisionId);
    if (!rev || rev.reason !== "less-time" || rev.scope !== "today" || rev.afterMinutes === null) return null;
    minutes.push(rev.afterMinutes);
  }
  return minutes;
}

export function candidateCheckIns(data: AppData, today: ISODate, now: number): CheckIn[] {
  const p = data.profile;
  if (!p) return [];
  const out: CheckIn[] = [];
  const lastSessionAt = data.sessions.at(-1)?.endedAt ?? null;
  const rec = (k: CheckInKind) => data.checkIns[k];

  const gap = daysSinceLastSession(data, today);
  const hasReturnRevision = data.revisions.some((r) => r.date === today && r.reason === "returning");
  if (
    gap !== null &&
    gap >= RETURN_GAP_DAYS &&
    plannedSessionFor(data, today) &&
    !hasReturnRevision &&
    !data.activeSession &&
    eligible(rec("welcome-back"), now, lastSessionAt)
  ) {
    out.push({
      kind: "welcome-back",
      question: "Welcome back! Want an easier first session today?",
      detail: `It's been ${gap} days. We can lighten today's workout so it feels good to return.`,
      acceptLabel: "Show me an easier session",
      effect: { type: "navigate", href: "/adjust?reason=returning" },
    });
  }

  const shortened = shortenedMinutes(data);
  if (shortened && suggestedMinutes(shortened) < p.sessionMinutes && eligible(rec("shorter-sessions"), now, lastSessionAt)) {
    const minutes = suggestedMinutes(shortened);
    out.push({
      kind: "shorter-sessions",
      question: "You shortened your last two sessions. Would shorter workouts suit you better?",
      detail: `If you accept, future sessions will be planned for about ${minutes} minutes instead of ${p.sessionMinutes}. You can change this anytime.`,
      acceptLabel: `Switch to ${minutes}-minute sessions`,
      effect: { type: "apply" },
    });
  }

  const lastTwo = data.sessions.slice(-2);
  if (
    lastTwo.length === 2 &&
    lastTwo.every((s) => s.difficulty === "too-hard") &&
    p.intensity !== "gentle" &&
    eligible(rec("too-hard-streak"), now, lastSessionAt)
  ) {
    out.push({
      kind: "too-hard-streak",
      question: "Your last two sessions felt too hard. Want slightly gentler sessions for a while?",
      detail: "If you accept, future sessions will use easier variations and fewer sets. You can raise it again later.",
      acceptLabel: "Make it gentler",
      effect: { type: "apply" },
    });
  }
  if (
    lastTwo.length === 2 &&
    lastTwo.every((s) => s.difficulty === "too-easy" && s.status === "completed") &&
    p.intensity !== "challenging" &&
    eligible(rec("too-easy-streak"), now, lastSessionAt)
  ) {
    out.push({
      kind: "too-easy-streak",
      question: "Your last two sessions felt easy. Ready for a little more challenge?",
      detail: "If you accept, future sessions will use slightly harder variations and an extra set on main movements.",
      acceptLabel: "Step it up",
      effect: { type: "apply" },
    });
  }

  if (data.sessions.length >= 1 && !data.meals.prefs && eligible(rec("meal-setup"), now, null)) {
    out.push({
      kind: "meal-setup",
      question: "Want simple meal ideas that fit your budget?",
      detail: "Tell us your budget and any dietary needs — it takes about a minute.",
      acceptLabel: "Set up meals",
      effect: { type: "navigate", href: "/meals/preferences" },
    });
  }
  return out;
}

/** The single check-in to show right now, if any. */
export function currentCheckIn(data: AppData, today: ISODate, now: number): CheckIn | null {
  if (data.lastCheckInShownAt && now - data.lastCheckInShownAt < GLOBAL_COOLDOWN_MS) return null;
  return candidateCheckIns(data, today, now)[0] ?? null;
}

function record(data: AppData, kind: CheckInKind, patch: Partial<CheckInRecord>, now: number): AppData {
  const prev: CheckInRecord = data.checkIns[kind] ?? {
    lastShownAt: null,
    snoozedUntil: null,
    resolvedAt: null,
    resolution: null,
  };
  return {
    ...data,
    checkIns: { ...data.checkIns, [kind]: { ...prev, lastShownAt: now, ...patch } },
    lastCheckInShownAt: now,
  };
}

export function snoozeCheckIn(data: AppData, kind: CheckInKind, now: number): AppData {
  return record(data, kind, { snoozedUntil: now + SNOOZE_MS }, now);
}

export function dismissCheckIn(data: AppData, kind: CheckInKind, now: number): AppData {
  return record(data, kind, { resolvedAt: now, resolution: "dismissed", snoozedUntil: null }, now);
}

export function acceptCheckIn(data: AppData, kind: CheckInKind, today: ISODate, now: number): AppData {
  let next = record(data, kind, { resolvedAt: now, resolution: "accepted", snoozedUntil: null }, now);
  const p = next.profile;
  if (!p) return next;
  if (kind === "shorter-sessions") {
    const shortened = shortenedMinutes(data);
    if (!shortened) return next;
    const minutes = suggestedMinutes(shortened);
    next = { ...next, profile: { ...p, sessionMinutes: minutes } };
    next = regeneratePlan(next, `Sessions shortened to about ${minutes} minutes (check-in).`, today, now);
    next = addMemory(
      next,
      { text: `Prefers sessions of about ${minutes} minutes`, category: "schedule", source: "check-in" },
      now,
    );
  } else if (kind === "too-hard-streak") {
    const intensity = p.intensity === "challenging" ? "standard" : "gentle";
    next = { ...next, profile: { ...p, intensity } };
    next = regeneratePlan(next, "Plan made gentler (check-in).", today, now);
    next = addMemory(next, { text: "Prefers a gentler pace for now", category: "training", source: "check-in" }, now);
  } else if (kind === "too-easy-streak") {
    const intensity = p.intensity === "gentle" ? "standard" : "challenging";
    next = { ...next, profile: { ...p, intensity } };
    next = regeneratePlan(next, "Plan made more challenging (check-in).", today, now);
    next = addMemory(next, { text: "Ready for more challenge", category: "training", source: "check-in" }, now);
  }
  return next;
}
