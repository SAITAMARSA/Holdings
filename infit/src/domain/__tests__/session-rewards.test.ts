import { describe, expect, it } from "vitest";
import { applyProposal, proposeAdjustment } from "../adjust";
import { addDays } from "../dates";
import { plannedSessionFor } from "../plan";
import { consistencyStats, weekSummary } from "../progress";
import { POINTS, totalPoints, unlockedAccessories } from "../rewards";
import {
  completeSet,
  extendRest,
  finishSession,
  pauseSession,
  replaceInSession,
  restRemainingMs,
  resumeSession,
  startSession,
  uncompleteSet,
  updateSetValues,
} from "../session";
import { twinMood } from "../twin";
import { MONDAY, at, doWorkout, onboarded } from "./helpers";

describe("active session", () => {
  it("prefills but never records proposed values without explicit completion", () => {
    const d = onboarded();
    const s = startSession(d, plannedSessionFor(d, MONDAY)!, 0);
    expect(s.exercises[0].sets[0].reps).not.toBeNull();
    expect(s.exercises.every((e) => e.sets.every((x) => !x.completed))).toBe(true);
    const r = finishSession({ ...d, activeSession: s }, { difficulty: null, energy: null }, 1000);
    expect(r.completed).toBeNull(); // nothing confirmed → nothing saved
    expect(r.data.sessions).toHaveLength(0);
  });

  it("uses wall-clock rest timers that survive pause/resume and backgrounding", () => {
    const d = onboarded();
    let s = startSession(d, plannedSessionFor(d, MONDAY)!, 0);
    s = completeSet(s, 0, 0, 10_000);
    expect(s.rest).not.toBeNull();
    const dur = s.rest!.durationSec * 1000;
    expect(restRemainingMs(s, 10_000)).toBe(dur);
    // Tab backgrounded for 20s: remaining is computed from the clock.
    expect(restRemainingMs(s, 30_000)).toBe(dur - 20_000);
    s = pauseSession(s, 30_000);
    expect(restRemainingMs(s, 500_000)).toBe(dur - 20_000); // frozen while paused
    expect(completeSet(s, 0, 1, 500_000)).toBe(s); // can't complete sets while paused
    s = resumeSession(s, 500_000);
    expect(restRemainingMs(s, 505_000)).toBe(dur - 25_000);
    s = extendRest(s, 30, 505_000);
    expect(restRemainingMs(s, 505_000)).toBe(dur - 20_000 + 30_000 - 5_000);
    expect(s.pausedMs).toBe(470_000);
  });

  it("only allows replacing an exercise before any of its sets are done", () => {
    const d = onboarded();
    let s = startSession(d, plannedSessionFor(d, MONDAY)!, 0);
    const replaced = replaceInSession(s, 0, "bodyweight-squat");
    expect(replaced.exercises[0].exerciseId).toBe("bodyweight-squat");
    expect(replaced.exercises[0].replacedFromId).toBe(s.exercises[0].exerciseId);
    s = completeSet(s, 0, 0, 1);
    expect(replaceInSession(s, 0, "bodyweight-squat")).toBe(s);
  });

  it("records the user's edited values, not the prefills", () => {
    const d = onboarded();
    let s = startSession(d, plannedSessionFor(d, MONDAY)!, 0);
    s = updateSetValues(s, 0, 0, { reps: 6 });
    s = completeSet(s, 0, 0, 1000);
    const r = finishSession({ ...d, activeSession: s }, { difficulty: "too-hard", energy: "low" }, 2000);
    expect(r.completed!.exercises[0].sets[0].reps).toBe(6);
    expect(r.completed!.status).toBe("partial");
    expect(r.completed!.difficulty).toBe("too-hard");
  });
});

describe("rewards", () => {
  it("records partial sessions accurately with partial points", () => {
    const d = doWorkout(onboarded(), MONDAY, { sets: 3 });
    expect(d.sessions[0].status).toBe("partial");
    expect(d.sessions[0].completedSets).toBe(3);
    expect(totalPoints(d)).toBe(POINTS.first + POINTS.partial);
  });

  it("is idempotent: repeating, toggling or redoing a day never double-awards", () => {
    let d = doWorkout(onboarded(), MONDAY);
    const after1 = totalPoints(d);
    expect(after1).toBe(POINTS.first + POINTS.complete);
    d = doWorkout(d, MONDAY); // same day again
    d = doWorkout(d, MONDAY, { sets: 1 });
    expect(totalPoints(d)).toBe(after1);
    // Toggling a set before finishing doesn't award anything.
    const s0 = startSession(d, plannedSessionFor(d, MONDAY)!, 0);
    let s = s0;
    for (let i = 0; i < 10; i++) s = uncompleteSet(completeSet(s, 0, 0, i), 0, 0);
    expect(s.exercises[0].sets[0].completed).toBe(false);
    expect(totalPoints(d)).toBe(after1);
  });

  it("a full session after a partial one tops up to the full value, once", () => {
    let d = doWorkout(onboarded(), MONDAY, { sets: 2 });
    d = doWorkout(d, MONDAY);
    expect(totalPoints(d)).toBe(POINTS.first + POINTS.complete);
  });

  it("double-submitting the same session saves it once", () => {
    const d = onboarded();
    let s = startSession(d, plannedSessionFor(d, MONDAY)!, 0);
    s = completeSet(s, 0, 0, 1);
    const once = finishSession({ ...d, activeSession: s }, { difficulty: null, energy: null }, 2).data;
    const twice = finishSession({ ...once, activeSession: s }, { difficulty: null, energy: null }, 3).data;
    expect(twice.sessions).toHaveLength(1);
    expect(totalPoints(twice)).toBe(totalPoints(once));
  });

  it("rest days don't break consistency and the weekly goal counts only planned days", () => {
    let d = onboarded(); // Mon, Wed, Fri
    d = doWorkout(d, MONDAY);
    d = doWorkout(d, addDays(MONDAY, 2));
    const fri = addDays(MONDAY, 4);
    expect(weekSummary(d, MONDAY, fri).goalMet).toBe(false);
    d = doWorkout(d, fri);
    const w = weekSummary(d, MONDAY, addDays(MONDAY, 6));
    expect(w.plannedCount).toBe(3);
    expect(w.restDays).toBe(4);
    expect(w.goalMet).toBe(true);
    expect(d.rewards.filter((r) => r.kind === "weekly-goal")).toHaveLength(1);
    expect(consistencyStats(d, addDays(MONDAY, 6)).currentActiveWeekRun).toBe(1);
  });

  it("a shortened, accepted session satisfies the revised commitment without inflating workload", () => {
    let d = onboarded();
    const original = plannedSessionFor(d, MONDAY)!;
    const r = proposeAdjustment({ data: d, date: MONDAY }, { reason: "less-time", minutes: 15 });
    if (!r.ok) throw new Error(r.message);
    d = applyProposal(d, r.proposal, "today", at(MONDAY, 9));
    d = doWorkout(d, MONDAY);
    const s = d.sessions[0];
    expect(s.status).toBe("completed");
    expect(s.source).toBe("adjusted");
    expect(s.plannedSets).toBeLessThan(original.exercises.reduce((n, e) => n + e.sets, 0));
    expect(s.plannedMinutes).toBeLessThan(original.estMinutes);
  });

  it("returning after a break earns a one-time comeback reward", () => {
    let d = doWorkout(onboarded(), MONDAY);
    const later = addDays(MONDAY, 21); // a Monday three weeks later
    d = doWorkout(d, later);
    expect(d.sessions[1].isReturn).toBe(true);
    expect(d.rewards.filter((r) => r.kind === "comeback")).toHaveLength(1);
    d = doWorkout(d, later);
    expect(d.rewards.filter((r) => r.kind === "comeback")).toHaveLength(1);
  });

  it("accessories unlock permanently from cosmetic points", () => {
    let d = onboarded();
    expect(unlockedAccessories(d).size).toBe(0);
    d = doWorkout(d, MONDAY);
    expect(unlockedAccessories(d).has("sunglasses")).toBe(true);
  });
});

describe("twin", () => {
  it("never guilts: messages for missed days, rest days, partial and pain are kind", () => {
    let d = onboarded();
    const wed = addDays(MONDAY, 2);
    const rest = twinMood(d, addDays(MONDAY, 1));
    expect(rest.expression).toBe("sleepy");
    const afterMiss = twinMood({ ...d, twin: { ...d.twin, mode: "competitive" } }, wed);
    expect(afterMiss.message).not.toMatch(/lazy|fail|disappoint|missed/i);
    d = doWorkout(d, wed, { sets: 2 });
    expect(twinMood(d, wed).message).toMatch(/2 of \d+ sets/);
    const paused = { ...d, competitionPausedDates: [addDays(MONDAY, 4)], twin: { ...d.twin, mode: "competitive" as const } };
    expect(twinMood(paused, addDays(MONDAY, 4)).message).toMatch(/No racing/);
  });

  it("follows the same agreed schedule as the user (rest when the user's day moves)", () => {
    const d = onboarded();
    const r = proposeAdjustment({ data: d, date: MONDAY }, { reason: "schedule-changed", action: "rest-today" });
    if (!r.ok) throw new Error();
    const next = applyProposal(d, r.proposal, "today", 1);
    const w = weekSummary(next, MONDAY, addDays(MONDAY, 1));
    expect(w.plannedCount).toBe(2);
    expect(w.twinCount).toBe(0); // the Twin rested on Monday too
  });
});
