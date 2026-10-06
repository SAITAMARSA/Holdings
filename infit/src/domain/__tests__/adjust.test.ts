import { describe, expect, it } from "vitest";
import { applyProposal, proposeAdjustment, revertDay, type AdjustInput } from "../adjust";
import { addDays } from "../dates";
import { getExercise } from "../exercises";
import { plannedSessionFor } from "../plan";
import { startSession } from "../session";
import { MONDAY, at, lifterAnswers, onboarded } from "./helpers";

const propose = (d: ReturnType<typeof onboarded>, input: AdjustInput, date = MONDAY) => {
  const r = proposeAdjustment({ data: d, date }, input);
  if (!r.ok) throw new Error(r.message);
  return r.proposal;
};

describe("adjust today", () => {
  it("does not change anything until accepted (cancel = no-op)", () => {
    const d = onboarded(lifterAnswers);
    const before = JSON.stringify(d);
    const p = propose(d, { reason: "less-time", minutes: 20 });
    expect(p.after!.estMinutes).toBeLessThanOrEqual(20);
    expect(JSON.stringify(d)).toBe(before); // proposing is pure
  });

  it("applies a temporary change only to today and preserves the original plan", () => {
    const d = onboarded(lifterAnswers);
    const original = plannedSessionFor(d, MONDAY)!;
    const p = propose(d, { reason: "less-time", minutes: 20 });
    const next = applyProposal(d, p, "today", at(MONDAY, 9));
    expect(plannedSessionFor(next, MONDAY)!.estMinutes).toBeLessThanOrEqual(20);
    expect(plannedSessionFor(next, MONDAY)!.source).toBe("adjusted");
    // Next Monday is back to normal; plan version unchanged; profile unchanged.
    expect(plannedSessionFor(next, addDays(MONDAY, 7))!.estMinutes).toBe(original.estMinutes);
    expect(next.plan!.version).toBe(1);
    expect(next.profile!.sessionMinutes).toBe(60);
    expect(next.revisions).toHaveLength(1);
    expect(next.revisions[0].before).toEqual(original);
    expect(next.memory).toHaveLength(0); // one-time action is not remembered
  });

  it("a lasting change updates future plans, archives the old plan and is remembered", () => {
    const d = onboarded(lifterAnswers);
    const p = propose(d, { reason: "less-time", minutes: 30 });
    expect(p.scopes.map((s) => s.scope)).toEqual(["today", "future"]);
    const next = applyProposal(d, p, "future", at(MONDAY, 9));
    expect(next.profile!.sessionMinutes).toBe(30);
    expect(next.plan!.version).toBe(2);
    expect(next.planHistory).toHaveLength(1);
    expect(plannedSessionFor(next, addDays(MONDAY, 7))!.estMinutes).toBeLessThanOrEqual(30);
    expect(next.memory[0].text).toMatch(/30 minutes/);
    expect(next.memory[0].source).toBe("adjustment");
  });

  it("rejects scopes that were not offered", () => {
    const d = onboarded(lifterAnswers);
    const p = propose(d, { reason: "schedule-changed", action: "rest-today" });
    expect(() => applyProposal(d, p, "future", 0)).toThrow();
  });

  it("swaps unavailable equipment for the same movement", () => {
    const d = onboarded(lifterAnswers);
    const p = propose(d, { reason: "equipment-unavailable", missing: ["barbell", "bench"] });
    for (const pe of p.after!.exercises) {
      const ex = getExercise(pe.exerciseId)!;
      expect(ex.equipment).not.toContain("barbell");
    }
    expect(p.after!.exercises.map((e) => e.pattern)).toEqual(p.before!.exercises.map((e) => e.pattern));
  });

  it("training at home re-picks exercises for home equipment, optionally remembering it", () => {
    const d = onboarded(lifterAnswers);
    const p = propose(d, { reason: "at-home", equipment: ["dumbbells"] });
    expect(p.after!.location).toBe("home");
    for (const pe of p.after!.exercises) {
      expect(getExercise(pe.exerciseId)!.equipment.every((e) => e === "dumbbells")).toBe(true);
    }
    const kept = applyProposal(d, p, "today", 1, { rememberHomeEquipment: true });
    expect(kept.equipmentProfiles.find((x) => x.kind === "home")!.equipment).toEqual(["dumbbells"]);
    expect(kept.profile!.location).toBe("gym"); // just today
    const notKept = applyProposal(d, p, "today", 1, { rememberHomeEquipment: false });
    expect(notKept.equipmentProfiles.find((x) => x.kind === "home")!.equipment).toEqual([]);
  });

  it("pain makes today a rest day, pauses competition and shows safety guidance", () => {
    const d = onboarded(lifterAnswers);
    const p = propose(d, { reason: "too-difficult", kind: "pain" });
    expect(p.safety).toMatch(/health professional/);
    const next = applyProposal(d, p, "today", 1);
    expect(plannedSessionFor(next, MONDAY)).toBeNull();
    expect(next.competitionPausedDates).toContain(MONDAY);
  });

  it("moving a session keeps the week coherent (today rest, target day gets the session)", () => {
    const d = onboarded(lifterAnswers); // Mon, Tue, Thu, Fri
    const wed = addDays(MONDAY, 2);
    const p = propose(d, { reason: "schedule-changed", action: "move", toDate: wed });
    const next = applyProposal(d, p, "today", 1);
    expect(plannedSessionFor(next, MONDAY)).toBeNull();
    expect(plannedSessionFor(next, wed)!.name).toBe(plannedSessionFor(d, MONDAY)!.name);
    // Can't move onto a day that already has training.
    const r = proposeAdjustment(
      { data: d, date: MONDAY },
      { reason: "schedule-changed", action: "move", toDate: addDays(MONDAY, 1) },
    );
    expect(r.ok).toBe(false);
  });

  it("training on a rest day brings the next session forward", () => {
    const d = onboarded(lifterAnswers);
    const wed = addDays(MONDAY, 2);
    const thu = addDays(MONDAY, 3);
    const p = propose(d, { reason: "schedule-changed", action: "train-today" }, wed);
    const next = applyProposal(d, p, "today", 1);
    expect(plannedSessionFor(next, wed)).not.toBeNull();
    expect(plannedSessionFor(next, thu)).toBeNull();
  });

  it("changing training days rebuilds the plan from today", () => {
    const d = onboarded(lifterAnswers);
    const p = propose(d, { reason: "schedule-changed", action: "change-days", days: [1, 3, 5] });
    const next = applyProposal(d, p, "future", at(MONDAY, 9));
    expect(next.profile!.trainingDays).toEqual([1, 3, 5]);
    expect(plannedSessionFor(next, addDays(MONDAY, 1))).not.toBeNull();
    expect(plannedSessionFor(next, addDays(MONDAY, 7))).toBeNull(); // next Monday
  });

  it("returning after a break eases the session and can ramp a week + fresh baseline", () => {
    const d = onboarded(lifterAnswers);
    const p = propose(d, { reason: "returning", away: "2-4w" });
    expect(p.after!.estMinutes).toBeLessThan(p.before!.estMinutes);
    const next = applyProposal(d, p, "future", 1, { freshBaseline: true });
    expect(next.ramp).toEqual({ from: MONDAY, until: addDays(MONDAY, 6) });
    expect(plannedSessionFor(next, addDays(MONDAY, 1))!.source).toBe("ramp");
    expect(plannedSessionFor(next, addDays(MONDAY, 7))!.source).toBe("plan");
    expect(next.baselines).toHaveLength(1);
  });

  it("swapping an exercise for the future prefers the replacement in later plans", () => {
    const d = onboarded(lifterAnswers);
    const s = plannedSessionFor(d, MONDAY)!;
    const target = s.exercises[0];
    const alt = "machine-chest-press";
    const p = propose(d, { reason: "swap-exercise", exerciseId: target.exerciseId, replacementId: alt });
    const next = applyProposal(d, p, "future", at(MONDAY, 9));
    expect(plannedSessionFor(next, addDays(MONDAY, 7))!.exercises[0].exerciseId).toBe(alt);
    expect(next.profile!.avoidExercises).toContain(target.exerciseId);
  });

  it("blocks adjustment during an active workout and on rest days with a clear message", () => {
    const d = onboarded(lifterAnswers);
    const withActive = { ...d, activeSession: startSession(d, plannedSessionFor(d, MONDAY)!, 0) };
    expect(proposeAdjustment({ data: withActive, date: MONDAY }, { reason: "less-time", minutes: 10 }).ok).toBe(false);
    const wed = addDays(MONDAY, 2);
    const r = proposeAdjustment({ data: d, date: wed }, { reason: "less-time", minutes: 10 });
    expect(r.ok).toBe(false);
  });

  it("can undo a today-only adjustment while keeping revision history", () => {
    const d = onboarded(lifterAnswers);
    const next = applyProposal(d, propose(d, { reason: "less-time", minutes: 20 }), "today", 1);
    const undone = revertDay(next, MONDAY);
    expect(plannedSessionFor(undone, MONDAY)).toEqual(plannedSessionFor(d, MONDAY));
    expect(undone.revisions).toHaveLength(1);
  });
});
