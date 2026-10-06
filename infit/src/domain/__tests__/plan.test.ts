import { describe, expect, it } from "vitest";
import { addDays, weekdayOf } from "../dates";
import { getExercise } from "../exercises";
import { estimateMinutes, fitToMinutes, plannedSessionFor } from "../plan";
import { completeOnboarding, createEmptyData, isOnboardingComplete } from "../state";
import { MONDAY, at, beginnerAnswers, lifterAnswers, onboarded } from "./helpers";

describe("onboarding → plan", () => {
  it("rejects incomplete answers", () => {
    expect(isOnboardingComplete({ name: "Sam" })).toBe(false);
    expect(() => completeOnboarding(createEmptyData(), { name: "Sam" }, 0)).toThrow();
  });

  it("gives beginners plain language, bodyweight home exercises and three spread-out days", () => {
    const d = onboarded(beginnerAnswers);
    expect(d.profile?.displayDetail).toBe("simple");
    expect(d.profile?.trainingDays).toEqual([0, 2, 4]);
    const s = plannedSessionFor(d, MONDAY)!;
    expect(s).not.toBeNull();
    for (const pe of s.exercises) {
      const ex = getExercise(pe.exerciseId)!;
      expect(ex.equipment).toEqual([]); // home default = bodyweight
      expect(ex.level).toBe(1);
      expect(pe.sets).toBe(2);
    }
    expect(s.estMinutes).toBeLessThanOrEqual(30);
    expect(plannedSessionFor(d, addDays(MONDAY, 1))).toBeNull(); // Tuesday rest
  });

  it("gives experienced gym users an upper/lower split that respects limitations and time", () => {
    const d = onboarded(lifterAnswers);
    expect(d.profile?.displayDetail).toBe("detailed");
    expect(d.plan?.templates.map((t) => t.name)).toEqual(["Upper body", "Lower body", "Upper body", "Lower body"]);
    for (let i = 0; i < 7; i++) {
      const s = plannedSessionFor(d, addDays(MONDAY, i));
      if (!s) continue;
      expect(s.estMinutes).toBeLessThanOrEqual(60);
      for (const pe of s.exercises) {
        expect(getExercise(pe.exerciseId)!.stresses).not.toContain("lower-back");
      }
    }
  });

  it("keeps experience level and display detail separately editable", () => {
    const d = onboarded(beginnerAnswers);
    const edited = { ...d.profile!, displayDetail: "detailed" as const };
    expect(edited.experience).toBe("new");
    expect(edited.displayDetail).toBe("detailed");
  });
});

describe("fitToMinutes", () => {
  it("drops accessories before main movements and never exceeds the time when possible", () => {
    const d = onboarded(lifterAnswers);
    const s = plannedSessionFor(d, MONDAY)!;
    const { exercises, changes } = fitToMinutes(s.exercises, 20);
    expect(estimateMinutes(exercises)).toBeLessThanOrEqual(20);
    expect(exercises.some((e) => e.priority === 1)).toBe(true);
    expect(exercises.every((e) => e.priority !== 3)).toBe(true);
    expect(changes.length).toBeGreaterThan(0);
  });

  it("is a no-op when the session already fits", () => {
    const d = onboarded(beginnerAnswers);
    const s = plannedSessionFor(d, MONDAY)!;
    expect(fitToMinutes(s.exercises, 90).changes).toEqual([]);
  });
});

describe("plannedSessionFor", () => {
  it("is deterministic for a date", () => {
    const d = onboarded();
    expect(plannedSessionFor(d, MONDAY)).toEqual(plannedSessionFor(d, MONDAY));
    expect(weekdayOf(MONDAY)).toBe(0);
  });

  it("uses the plan version effective at the time for past dates", () => {
    const d0 = onboarded();
    const original = plannedSessionFor(d0, MONDAY);
    const d1 = completeOnboarding(createEmptyData(), { ...beginnerAnswers }, at(MONDAY));
    expect(plannedSessionFor(d1, MONDAY)?.name).toBe(original?.name);
  });
});
