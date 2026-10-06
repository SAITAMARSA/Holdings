import { daysBetween, type ISODate, startOfWeek, weekDates, addDays } from "./dates";
import { getExercise } from "./exercises";
import { plannedSessionFor } from "./plan";
import type { AppData, CompletedSession, CompletedSet, PlannedSession } from "./schema";

/**
 * Consistency, performance and personal feedback are kept separate:
 * - Consistency counts showing up (rest days never count against you).
 * - Performance only compares the same exercise with itself.
 * - Feedback is whatever the user chose to tell us.
 * Nothing here invents improvement: with too little data we say so.
 */

export type DayState = "rest" | "upcoming" | "today" | "completed" | "partial" | "not-done" | "extra";

export interface DayStatus {
  date: ISODate;
  planned: PlannedSession | null;
  session: CompletedSession | null;
  state: DayState;
}

export function sessionsOn(data: Pick<AppData, "sessions">, date: ISODate): CompletedSession[] {
  return data.sessions.filter((s) => s.date === date);
}

/** Best record for a day: a completed session beats a partial one. */
export function bestSessionOn(data: Pick<AppData, "sessions">, date: ISODate): CompletedSession | null {
  const list = sessionsOn(data, date);
  return list.find((s) => s.status === "completed") ?? list[0] ?? null;
}

export function dayStatus(data: AppData, date: ISODate, today: ISODate): DayStatus {
  const planned = plannedSessionFor(data, date);
  const session = bestSessionOn(data, date);
  let state: DayState;
  if (session) state = planned ? session.status : "extra";
  else if (!planned) state = "rest";
  else if (date === today) state = "today";
  else if (date > today) state = "upcoming";
  else state = "not-done";
  return { date, planned, session, state };
}

export interface WeekSummary {
  start: ISODate;
  days: DayStatus[];
  /** Training days in the agreed (possibly adjusted) schedule. */
  plannedCount: number;
  completedCount: number;
  partialCount: number;
  /** Planned days the user trained (fully or partly). */
  showedUp: number;
  extraCount: number;
  restDays: number;
  goalMet: boolean;
  /** Sessions the Twin has done: planned days up to today (it trains with you). */
  twinCount: number;
}

export function weekSummary(data: AppData, anyDate: ISODate, today: ISODate): WeekSummary {
  const days = weekDates(anyDate).map((d) => dayStatus(data, d, today));
  const plannedDays = days.filter((d) => d.planned);
  const completedCount = days.filter((d) => d.state === "completed").length;
  const partialCount = days.filter((d) => d.state === "partial").length;
  const showedUp = completedCount + partialCount;
  const twinCount = plannedDays.filter(
    (d) => d.date < today || (d.date === today && (d.state === "completed" || d.state === "partial")),
  ).length;
  return {
    start: startOfWeek(anyDate),
    days,
    plannedCount: plannedDays.length,
    completedCount,
    partialCount,
    showedUp,
    extraCount: days.filter((d) => d.state === "extra").length,
    restDays: days.filter((d) => !d.planned).length,
    goalMet: plannedDays.length > 0 && showedUp >= plannedDays.length,
    twinCount,
  };
}

// ---------------------------------------------------------------- consistency

export interface ConsistencyStats {
  totalSessions: number;
  completedSessions: number;
  partialSessions: number;
  activeWeeks: number;
  comebacks: number;
  /** Consecutive weeks (including this one if active) with at least one session. */
  currentActiveWeekRun: number;
  totalMinutes: number;
}

export function consistencyStats(data: AppData, today: ISODate): ConsistencyStats {
  const weeks = new Set(data.sessions.map((s) => startOfWeek(s.date)));
  let run = 0;
  let cursor = startOfWeek(today);
  // A week without sessions yet (this week) doesn't break the run.
  if (!weeks.has(cursor)) cursor = addDays(cursor, -7);
  while (weeks.has(cursor)) {
    run++;
    cursor = addDays(cursor, -7);
  }
  return {
    totalSessions: data.sessions.length,
    completedSessions: data.sessions.filter((s) => s.status === "completed").length,
    partialSessions: data.sessions.filter((s) => s.status === "partial").length,
    activeWeeks: weeks.size,
    comebacks: data.sessions.filter((s) => s.isReturn).length,
    currentActiveWeekRun: run,
    totalMinutes: Math.round(data.sessions.reduce((n, s) => n + s.activeSeconds, 0) / 60),
  };
}

export function daysSinceLastSession(data: Pick<AppData, "sessions">, today: ISODate): number | null {
  const last = data.sessions.at(-1);
  return last ? daysBetween(last.date, today) : null;
}

// ---------------------------------------------------------------- performance

export interface PerformancePoint {
  date: ISODate;
  sessionId: string;
  /** Load of the best set (kg), if loaded. */
  loadKg: number | null;
  reps: number;
  unit: "reps" | "seconds";
}

export interface ExerciseHistory {
  exerciseId: string;
  name: string;
  points: PerformancePoint[];
  /** Points before the latest baseline (kept, but not compared). */
  earlier: PerformancePoint[];
  trend: { kind: "insufficient" | "up" | "steady" | "down"; text: string };
}

function bestSet(sets: CompletedSet[], loaded: boolean): CompletedSet | null {
  if (sets.length === 0) return null;
  return [...sets].sort((a, b) => (loaded ? (b.loadKg ?? 0) - (a.loadKg ?? 0) || b.reps - a.reps : b.reps - a.reps))[0];
}

export function latestBaseline(data: Pick<AppData, "baselines">): ISODate | null {
  return data.baselines.length ? [...data.baselines].sort((a, b) => (a.date < b.date ? 1 : -1))[0].date : null;
}

function fmt(p: PerformancePoint, unit: "kg" | "lb"): string {
  const reps = p.unit === "seconds" ? `${p.reps}s` : `${p.reps} reps`;
  if (p.loadKg === null) return reps;
  const load = unit === "lb" ? Math.round(p.loadKg * 2.20462) : p.loadKg;
  return `${load} ${unit} × ${p.reps}`;
}

export function exerciseHistories(data: AppData): ExerciseHistory[] {
  const baseline = latestBaseline(data);
  const unit = data.profile?.units ?? "kg";
  const map = new Map<string, PerformancePoint[]>();
  for (const s of data.sessions) {
    for (const e of s.exercises) {
      const ex = getExercise(e.exerciseId);
      const loaded = Boolean(ex?.loaded) && e.sets.some((x) => x.loadKg !== null);
      const best = bestSet(e.sets, loaded);
      if (!best) continue;
      const list = map.get(e.exerciseId) ?? [];
      list.push({
        date: s.date,
        sessionId: s.id,
        loadKg: loaded ? best.loadKg : null,
        reps: best.reps,
        unit: ex?.unit ?? "reps",
      });
      map.set(e.exerciseId, list);
    }
  }
  return [...map.entries()]
    .map(([exerciseId, all]) => {
      const points = baseline ? all.filter((p) => p.date >= baseline) : all;
      const earlier = baseline ? all.filter((p) => p.date < baseline) : [];
      return { exerciseId, name: getExercise(exerciseId)?.name ?? "Exercise", points, earlier, trend: trendOf(points, unit) };
    })
    .sort((a, b) => b.points.length - a.points.length);
}

/**
 * Compare the first and latest comparable sets. Load only counts as progress
 * at the same or more reps; reps only count at the same or more load. A lower
 * planned target is never treated as an improvement.
 */
function trendOf(points: PerformancePoint[], unit: "kg" | "lb"): ExerciseHistory["trend"] {
  if (points.length < 2) {
    return { kind: "insufficient", text: "Do this exercise again to see a comparison." };
  }
  const first = points[0];
  const last = points[points.length - 1];
  const fl = first.loadKg ?? 0;
  const ll = last.loadKg ?? 0;
  const up = (ll > fl && last.reps >= first.reps) || (ll >= fl && last.reps > first.reps);
  const down = (ll < fl && last.reps <= first.reps) || (ll <= fl && last.reps < first.reps);
  if (up) return { kind: "up", text: `Best set: ${fmt(first, unit)} → ${fmt(last, unit)}` };
  if (down)
    return {
      kind: "down",
      text: `Latest best set ${fmt(last, unit)} (was ${fmt(first, unit)}). Dips are normal after changes, breaks or tiring days.`,
    };
  if (ll === fl && last.reps === first.reps) return { kind: "steady", text: `Holding steady at ${fmt(last, unit)}` };
  return {
    kind: "steady",
    text: `Mixed: ${fmt(first, unit)} → ${fmt(last, unit)}. Not directly comparable, so we're not calling it progress.`,
  };
}

// ---------------------------------------------------------------- feedback

export function feedbackSummary(sessions: CompletedSession[]) {
  const rated = sessions.filter((s) => s.difficulty);
  const count = (k: string) => rated.filter((s) => s.difficulty === k).length;
  const energyRated = sessions.filter((s) => s.energy);
  const e = (k: string) => energyRated.filter((s) => s.energy === k).length;
  return {
    rated: rated.length,
    tooEasy: count("too-easy"),
    aboutRight: count("about-right"),
    tooHard: count("too-hard"),
    energyRated: energyRated.length,
    energyLow: e("low"),
    energyOkay: e("okay"),
    energyGood: e("good"),
    painReports: sessions.filter((s) => s.painReported).length,
  };
}

// ---------------------------------------------------------------- weekly review

export interface WeeklyReview {
  hasData: boolean;
  headline: string;
  points: string[];
  nextStep: string;
}

export function weeklyReview(data: AppData, anyDate: ISODate, today: ISODate): WeeklyReview {
  const week = weekSummary(data, anyDate, today);
  const weekSessions = data.sessions.filter((s) => startOfWeek(s.date) === week.start);
  const revisions = data.revisions.filter((r) => startOfWeek(r.date) === week.start);
  const fb = feedbackSummary(weekSessions);
  const isNew = data.profile?.experience === "new";

  if (data.sessions.length === 0) {
    return {
      hasData: false,
      headline: "Your first review appears after your first workout",
      points: [],
      nextStep: "Start today's session — even a shortened one counts.",
    };
  }

  const points: string[] = [];
  const remaining = week.days.filter((d) => d.planned && d.date >= today && !d.session).length;
  points.push(
    `You trained on ${week.showedUp} of ${week.plannedCount} planned day${week.plannedCount === 1 ? "" : "s"}` +
      (week.partialCount ? ` (${week.partialCount} partly completed)` : "") +
      (remaining ? `, with ${remaining} still to come.` : "."),
  );
  if (week.extraCount) points.push(`Plus ${week.extraCount} extra session${week.extraCount > 1 ? "s" : ""} on a rest day.`);
  points.push(`${week.restDays} planned rest day${week.restDays === 1 ? "" : "s"} — recovery is part of the plan.`);
  if (revisions.length) {
    points.push(`You adjusted your plan ${revisions.length} time${revisions.length > 1 ? "s" : ""} to fit your week.`);
  }
  if (weekSessions.some((s) => s.isReturn)) points.push("You came back after a break. That's the hardest part.");
  if (fb.rated) {
    points.push(
      `How it felt: ${[
        fb.tooEasy && `${fb.tooEasy} too easy`,
        fb.aboutRight && `${fb.aboutRight} about right`,
        fb.tooHard && `${fb.tooHard} too hard`,
      ]
        .filter(Boolean)
        .join(", ")}.`,
    );
  }

  let nextStep: string;
  if (fb.painReports) {
    nextStep =
      "You reported pain this week. Keep things comfortable and consider checking in with a health professional before pushing harder.";
  } else if (fb.tooHard >= 2) {
    nextStep = "Two sessions felt too hard. Keep next week the same, or make your plan gentler from Adjust today.";
  } else if (week.plannedCount > 0 && week.showedUp < week.plannedCount / 2 && remaining === 0) {
    nextStep = "This week was busy. Shorter sessions or fewer training days might fit better — consistency beats intensity.";
  } else if (fb.tooEasy >= 2) {
    nextStep = isNew
      ? "Sessions are feeling easy. Next week, aim for the top of each rep range with steady form."
      : "Sessions are feeling easy. Try a small load increase (about 2.5 kg) on your main lifts next week.";
  } else if (week.goalMet) {
    nextStep = "You did everything you planned. Keep the same plan next week and build on it gradually.";
  } else {
    nextStep = "Keep going with the same plan. Adjust any day that doesn't fit — that still counts.";
  }

  const headline = week.goalMet
    ? "You completed this week's plan"
    : week.showedUp > 0
      ? `${week.showedUp} session${week.showedUp > 1 ? "s" : ""} this week`
      : "A quiet week so far";

  return { hasData: true, headline, points, nextStep };
}
