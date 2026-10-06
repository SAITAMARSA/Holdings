import { daysBetween } from "./dates";
import { getExercise } from "./exercises";
import { totalSets } from "./plan";
import { applyRewardsForSession } from "./rewards";
import type {
  ActiveExercise,
  ActiveSession,
  AppData,
  CompletedSession,
  CompletedSet,
  Difficulty,
  Energy,
  PlannedSession,
} from "./schema";
import { uid } from "./uid";

/**
 * Active workout state machine. All timing uses wall-clock timestamps, so the
 * rest timer and elapsed time stay correct after the tab is backgrounded or
 * the page reloads. Proposed values (prefills) are only recorded as work when
 * the user explicitly completes a set.
 */

export const RETURN_GAP_DAYS = 10;

export function lastPerformance(data: Pick<AppData, "sessions">, exerciseId: string): CompletedSet[] | null {
  for (let i = data.sessions.length - 1; i >= 0; i--) {
    const ex = data.sessions[i].exercises.find((e) => e.exerciseId === exerciseId && e.sets.length > 0);
    if (ex) return ex.sets;
  }
  return null;
}

export function startSession(data: AppData, planned: PlannedSession, now: number): ActiveSession {
  const exercises: ActiveExercise[] = planned.exercises.map((pe) => {
    const previous = lastPerformance(data, pe.exerciseId);
    return {
      slotId: pe.slotId,
      exerciseId: pe.exerciseId,
      replacedFromId: null,
      restSec: pe.restSec,
      target: pe.target,
      sets: Array.from({ length: pe.sets }, (_, i) => {
        const prev = previous?.[Math.min(i, previous.length - 1)];
        return {
          targetReps: pe.target.max,
          reps: prev?.reps ?? pe.target.max,
          loadKg: prev?.loadKg ?? null,
          completed: false,
          completedAt: null,
        };
      }),
    };
  });
  return {
    id: uid("session"),
    date: planned.date,
    planned,
    startedAt: now,
    pausedAt: null,
    pausedMs: 0,
    currentIndex: 0,
    exercises,
    rest: null,
    painReported: false,
  };
}

function mapSet(
  s: ActiveSession,
  exIdx: number,
  setIdx: number,
  fn: (set: ActiveExercise["sets"][number]) => ActiveExercise["sets"][number],
): ActiveSession {
  return {
    ...s,
    exercises: s.exercises.map((ex, i) =>
      i !== exIdx ? ex : { ...ex, sets: ex.sets.map((set, j) => (j === setIdx ? fn(set) : set)) },
    ),
  };
}

export function updateSetValues(
  s: ActiveSession,
  exIdx: number,
  setIdx: number,
  values: { reps?: number | null; loadKg?: number | null },
): ActiveSession {
  return mapSet(s, exIdx, setIdx, (set) => ({ ...set, ...values }));
}

export function completeSet(s: ActiveSession, exIdx: number, setIdx: number, now: number): ActiveSession {
  const set = s.exercises[exIdx]?.sets[setIdx];
  if (!set || set.completed || set.reps === null || s.pausedAt !== null) return s;
  let next = mapSet(s, exIdx, setIdx, (x) => ({ ...x, completed: true, completedAt: now }));
  const ex = next.exercises[exIdx];
  const exerciseDone = ex.sets.every((x) => x.completed);
  const allDone = next.exercises.every((e) => e.sets.every((x) => x.completed));
  if (!allDone && ex.restSec > 0) {
    next = { ...next, rest: { endsAt: now + ex.restSec * 1000, durationSec: ex.restSec, remainingMsAtPause: null } };
  } else {
    next = { ...next, rest: null };
  }
  if (exerciseDone && exIdx === next.currentIndex) {
    const nextOpen = next.exercises.findIndex((e, i) => i > exIdx && e.sets.some((x) => !x.completed));
    if (nextOpen !== -1) next = { ...next, currentIndex: nextOpen };
  }
  return next;
}

/** Undo a set completion (e.g. a mis-tap). Rewards are only granted on finish. */
export function uncompleteSet(s: ActiveSession, exIdx: number, setIdx: number): ActiveSession {
  return mapSet(s, exIdx, setIdx, (x) => ({ ...x, completed: false, completedAt: null }));
}

export function pauseSession(s: ActiveSession, now: number): ActiveSession {
  if (s.pausedAt !== null) return s;
  return {
    ...s,
    pausedAt: now,
    rest: s.rest ? { ...s.rest, remainingMsAtPause: Math.max(0, s.rest.endsAt - now) } : null,
  };
}

export function resumeSession(s: ActiveSession, now: number): ActiveSession {
  if (s.pausedAt === null) return s;
  return {
    ...s,
    pausedAt: null,
    pausedMs: s.pausedMs + Math.max(0, now - s.pausedAt),
    rest:
      s.rest && s.rest.remainingMsAtPause !== null
        ? { ...s.rest, endsAt: now + s.rest.remainingMsAtPause, remainingMsAtPause: null }
        : s.rest,
  };
}

export function restRemainingMs(s: ActiveSession, now: number): number {
  if (!s.rest) return 0;
  if (s.pausedAt !== null) return s.rest.remainingMsAtPause ?? 0;
  return Math.max(0, s.rest.endsAt - now);
}

export function extendRest(s: ActiveSession, seconds: number, now: number): ActiveSession {
  if (!s.rest) return s;
  if (s.pausedAt !== null) {
    return { ...s, rest: { ...s.rest, remainingMsAtPause: (s.rest.remainingMsAtPause ?? 0) + seconds * 1000 } };
  }
  return { ...s, rest: { ...s.rest, endsAt: Math.max(now, s.rest.endsAt) + seconds * 1000 } };
}

export function skipRest(s: ActiveSession): ActiveSession {
  return { ...s, rest: null };
}

export function elapsedActiveMs(s: ActiveSession, now: number): number {
  return Math.max(0, (s.pausedAt ?? now) - s.startedAt - s.pausedMs);
}

export function goToExercise(s: ActiveSession, index: number): ActiveSession {
  if (index < 0 || index >= s.exercises.length) return s;
  return { ...s, currentIndex: index };
}

export function canReplace(s: ActiveSession, exIdx: number): boolean {
  return !s.exercises[exIdx]?.sets.some((x) => x.completed);
}

/** Replace an exercise mid-workout. Only allowed before any of its sets are done. */
export function replaceInSession(s: ActiveSession, exIdx: number, replacementId: string): ActiveSession {
  const ex = s.exercises[exIdx];
  const replacement = getExercise(replacementId);
  if (!ex || !replacement || !canReplace(s, exIdx)) return s;
  const original = getExercise(ex.exerciseId);
  const target =
    replacement.unit === "seconds"
      ? { min: 20, max: 30 }
      : original?.unit === "seconds" || (original?.loaded && !replacement.loaded)
        ? { min: 8, max: 12 }
        : ex.target;
  return {
    ...s,
    exercises: s.exercises.map((e, i) =>
      i !== exIdx
        ? e
        : {
            ...e,
            exerciseId: replacement.id,
            replacedFromId: e.replacedFromId ?? e.exerciseId,
            target,
            sets: e.sets.map(() => ({
              targetReps: target.max,
              reps: target.max,
              loadKg: null,
              completed: false,
              completedAt: null,
            })),
          },
    ),
  };
}

export function sessionCounts(s: ActiveSession) {
  const planned = s.exercises.reduce((n, e) => n + e.sets.length, 0);
  const done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.completed).length, 0);
  return { planned, done };
}

export interface FinishFeedback {
  difficulty: Difficulty | null;
  energy: Energy | null;
}

/**
 * Convert the active session into a permanent record. Only sets the user
 * explicitly completed are stored. Returns null if nothing was completed —
 * the caller should offer to discard instead of saving an empty session.
 */
export function buildCompletedSession(data: AppData, feedback: FinishFeedback, now: number): CompletedSession | null {
  const s = data.activeSession;
  if (!s) return null;
  const { planned, done } = sessionCounts(s);
  if (done === 0) return null;
  const previous = data.sessions.filter((x) => x.date <= s.date).at(-1);
  const isReturn = previous ? daysBetween(previous.date, s.date) >= RETURN_GAP_DAYS : false;
  return {
    id: s.id,
    date: s.date,
    startedAt: s.startedAt,
    endedAt: now,
    activeSeconds: Math.round(elapsedActiveMs(s, now) / 1000),
    status: done >= planned ? "completed" : "partial",
    name: s.planned.name,
    source: s.planned.source,
    revisionId: s.planned.revisionId ?? null,
    plannedMinutes: s.planned.estMinutes,
    plannedSets: planned,
    completedSets: done,
    exercises: s.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      replacedFromId: e.replacedFromId,
      plannedSets: e.sets.length,
      sets: e.sets
        .filter((x) => x.completed && x.reps !== null)
        .map((x) => ({ reps: x.reps!, loadKg: x.loadKg, targetReps: x.targetReps, completedAt: x.completedAt! })),
    })),
    difficulty: feedback.difficulty,
    energy: feedback.energy,
    painReported: s.painReported,
    isReturn,
  };
}

export function finishSession(
  data: AppData,
  feedback: FinishFeedback,
  now: number,
): {
  data: AppData;
  completed: CompletedSession | null;
} {
  const completed = buildCompletedSession(data, feedback, now);
  if (!completed) return { data, completed: null };
  // Guard against double submission (e.g. a double tap): one record per session id.
  if (data.sessions.some((x) => x.id === completed.id)) {
    return { data: { ...data, activeSession: null }, completed };
  }
  let next: AppData = { ...data, activeSession: null, sessions: [...data.sessions, completed] };
  next = applyRewardsForSession(next, completed, now);
  return { data: next, completed };
}

export function discardSession(data: AppData): AppData {
  return { ...data, activeSession: null };
}

/** Report pain: pauses Twin competition today. Never auto-continues. */
export function reportPain(data: AppData): AppData {
  if (!data.activeSession) return data;
  return {
    ...data,
    activeSession: { ...data.activeSession, painReported: true, rest: null },
    competitionPausedDates: [...new Set([...data.competitionPausedDates, data.activeSession.date])],
  };
}

export { totalSets };
