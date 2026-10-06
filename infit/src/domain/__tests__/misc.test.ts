import { describe, expect, it } from "vitest";
import { demoReply } from "@/coach/demoProvider";
import { selectProvider } from "@/coach/server/providers";
import { CoachReply, type CoachRequest } from "@/coach/types";
import { CorruptDataError, MemoryAdapter } from "@/storage/adapter";
import { loadData, parseStored } from "@/storage/repository";
import { applyProposal, proposeAdjustment } from "../adjust";
import { acceptCheckIn, candidateCheckIns, currentCheckIn, dismissCheckIn, snoozeCheckIn } from "../checkins";
import { addDays } from "../dates";
import { DEFAULT_FILTERS, filterListings, SAMPLE_LISTINGS } from "../explore";
import { adaptMeal, MEALS, shoppingList, suggestMeals } from "../meals";
import { exerciseHistories, weeklyReview } from "../progress";
import type { MealPreferences } from "../schema";
import { createEmptyData } from "../state";
import { MONDAY, at, doWorkout, lifterAnswers, onboarded } from "./helpers";

describe("storage", () => {
  it("returns fresh data when nothing is stored", async () => {
    const r = await loadData(new MemoryAdapter(), "user");
    expect(r.status).toBe("empty");
    expect(r.data.onboarding.completed).toBe(false);
  });

  it("round-trips valid data", async () => {
    const a = new MemoryAdapter();
    const d = doWorkout(onboarded(), MONDAY);
    await a.save(d);
    const r = await loadData(a, "user");
    expect(r.status).toBe("ok");
    expect(r.data).toEqual(d);
  });

  it("migrates unversioned data", () => {
    const { version: _v, ...rest } = createEmptyData();
    void _v;
    expect(parseStored(rest, "user").status).toBe("migrated");
  });

  it("salvages valid sections from partly corrupted data", () => {
    const d = doWorkout(onboarded(), MONDAY);
    const broken = { ...d, explore: { saved: "not-an-array" } };
    const r = parseStored(broken, "user");
    expect(r.status).toBe("recovered");
    expect(r.data.sessions).toHaveLength(1);
    expect(r.data.explore.saved).toEqual([]);
    expect(r.notice).toBeTruthy();
  });

  it("starts fresh and backs up totally invalid data", async () => {
    const a = new MemoryAdapter();
    a.value = "garbage";
    const r = await loadData(a, "user");
    expect(r.status).toBe("recovered");
    expect(a.corrupt).toBe('"garbage"');
  });

  it("reports unparseable stored data instead of silently starting fresh", async () => {
    const a = new MemoryAdapter();
    a.load = async () => {
      throw new CorruptDataError();
    };
    const r = await loadData(a, "user");
    expect(r.status).toBe("recovered");
    expect(r.notice).toMatch(/backup/);
  });

  it("new users have no sample history", () => {
    const d = createEmptyData();
    expect(d.sessions).toEqual([]);
    expect(d.rewards).toEqual([]);
  });
});

describe("check-ins", () => {
  const shortenAndTrain = (d: ReturnType<typeof onboarded>, date: string) => {
    const r = proposeAdjustment({ data: d, date }, { reason: "less-time", minutes: 30 });
    if (!r.ok) throw new Error(r.message);
    return doWorkout(applyProposal(d, r.proposal, "today", at(date, 9)), date);
  };

  it("asks about shorter sessions after two shortened sessions, with accept/later/dismiss + cooldowns", () => {
    let d = onboarded(lifterAnswers); // Mon, Tue, Thu, Fri, 60 min
    d = shortenAndTrain(d, MONDAY);
    expect(candidateCheckIns(d, MONDAY, at(MONDAY, 20)).map((c) => c.kind)).not.toContain("shorter-sessions");
    const tue = addDays(MONDAY, 1);
    d = shortenAndTrain(d, tue);
    const now = at(tue, 20);
    const c = currentCheckIn(d, tue, now);
    expect(c?.kind).toBe("shorter-sessions");
    expect(c?.question).toMatch(/shortened your last two sessions/);

    // Later → hidden for 3 days.
    const snoozed = snoozeCheckIn(d, "shorter-sessions", now);
    expect(currentCheckIn(snoozed, tue, now + 3_600_000)).toBeNull();
    // Dismiss → doesn't come back on the same data.
    const dismissed = dismissCheckIn(d, "shorter-sessions", now);
    expect(candidateCheckIns(dismissed, tue, now + 40 * 86_400_000).map((x) => x.kind)).not.toContain("shorter-sessions");
    // Accept → applies the described lasting change.
    const accepted = acceptCheckIn(d, "shorter-sessions", tue, now);
    const longest = Math.max(...d.revisions.map((r) => r.afterMinutes!));
    expect(accepted.profile!.sessionMinutes).toBe(Math.ceil(longest / 5) * 5);
    expect(c?.acceptLabel).toContain(String(accepted.profile!.sessionMinutes));
    expect(accepted.plan!.version).toBe(2);
    expect(accepted.memory.some((m) => m.source === "check-in")).toBe(true);
  });

  it("offers a welcome-back check-in after a break", () => {
    let d = doWorkout(onboarded(), MONDAY);
    const later = addDays(MONDAY, 14);
    expect(currentCheckIn(d, later, at(later))?.kind).toBe("welcome-back");
    d = { ...d };
  });
});

describe("progress", () => {
  it("shows an empty state instead of inventing a review", () => {
    const r = weeklyReview(onboarded(), MONDAY, MONDAY);
    expect(r.hasData).toBe(false);
    expect(exerciseHistories(onboarded())).toEqual([]);
  });

  it("needs two comparable data points before claiming a trend", () => {
    let d = doWorkout(onboarded(), MONDAY);
    expect(exerciseHistories(d)[0].trend.kind).toBe("insufficient");
    d = doWorkout(d, addDays(MONDAY, 7));
    expect(["steady", "up", "down"]).toContain(exerciseHistories(d)[0].trend.kind);
  });

  it("does not treat a reduced target as improvement", () => {
    let d = doWorkout(onboarded(), MONDAY);
    d = doWorkout(d, addDays(MONDAY, 7), { sets: 1 });
    const h = exerciseHistories(d).find((x) => x.points.length === 2)!;
    expect(h.trend.kind).not.toBe("up");
  });

  it("a fresh baseline separates earlier history without deleting it", () => {
    let d = doWorkout(onboarded(), MONDAY);
    d = { ...d, baselines: [{ date: addDays(MONDAY, 21), reason: "test" }] };
    d = doWorkout(d, addDays(MONDAY, 21));
    const h = exerciseHistories(d)[0];
    expect(h.points).toHaveLength(1);
    expect(h.earlier).toHaveLength(1);
  });
});

describe("meals", () => {
  const prefs: MealPreferences = {
    currency: "GBP",
    weeklyBudget: 40,
    people: 1,
    diet: "vegan",
    allergies: ["soy"],
    cookingTime: "medium",
    pantry: ["rice"],
    updatedAt: 0,
  };

  it("respects diet and allergies, substituting where safe", () => {
    const list = suggestMeals(prefs);
    expect(list.length).toBeGreaterThan(0);
    for (const m of list) {
      for (const i of m.ingredients) {
        expect(["tofu", "soy-sauce", "soy-yogurt", "chicken-thigh", "eggs", "greek-yogurt", "cheese"]).not.toContain(i.id);
      }
      expect(m.meal.minutes).toBeLessThanOrEqual(30);
    }
    const stirFry = adaptMeal(MEALS.find((m) => m.id === "chicken-stir-fry")!, prefs)!;
    expect(stirFry.substitutions.map((s) => s.to)).toContain("Chickpeas (tinned)");
  });

  it("excludes pantry items from the shopping list cost and scales by people", () => {
    const one = shoppingList(["chickpea-curry"], prefs);
    const two = shoppingList(["chickpea-curry"], { ...prefs, people: 2 });
    expect(one.items.find((i) => i.id === "rice")!.inPantry).toBe(true);
    expect(two.totalUsd).toBeCloseTo(one.totalUsd * 2);
  });
});

describe("explore", () => {
  it("filters and shows saved listings", () => {
    expect(filterListings(SAMPLE_LISTINGS, { ...DEFAULT_FILTERS, type: "event" }, []).every((l) => l.type === "event")).toBe(true);
    expect(filterListings(SAMPLE_LISTINGS, { ...DEFAULT_FILTERS, savedOnly: true }, ["sample-hike"])).toHaveLength(1);
  });
});

describe("coach", () => {
  const ctx = (): CoachRequest["context"] => ({
    name: "Sam",
    experience: "new",
    displayDetail: "simple",
    goal: "habit",
    today: { rest: false, session: { name: "Full body A", purpose: "x", estMinutes: 25, adjusted: false, exercises: [] } },
    week: { planned: 3, showedUp: 0 },
    mealsSetUp: false,
    memory: [],
    daysSinceLastSession: null,
  });

  it("interrupts with safety guidance on pain and never says push through", () => {
    const r = demoReply({ message: "my knee hurts when I squat", context: ctx() });
    expect(r.safety).toBe(true);
    expect(r.text).not.toMatch(/push through it/i);
    expect(r.text).toMatch(/health professional/);
  });

  it("returns schema-valid replies labelled as demo for every quick action", () => {
    for (const qa of ["explain-today", "adjust-week", "replace-exercise", "meals", "returning"] as const) {
      const r = demoReply({ message: "x", quickAction: qa, context: ctx() });
      expect(CoachReply.safeParse(r).success).toBe(true);
      expect(r.source).toBe("demo");
    }
  });

  it("proposes (never silently saves) memories and refuses sensitive health details", () => {
    const r = demoReply({ message: "Remember that I prefer morning workouts", context: ctx() });
    expect(r.actions[0].type).toBe("propose-memory");
    const s = demoReply({ message: "remember that I am pregnant", context: ctx() });
    expect(s.actions.some((a) => a.type === "propose-memory")).toBe(false);
  });

  it("falls back to the demo provider when live isn't configured", () => {
    expect(selectProvider({}).provider.id).toBe("demo");
    const live = selectProvider({ COACH_PROVIDER: "live" });
    expect(live.provider.id).toBe("demo");
    expect(live.notice).toBeTruthy();
  });
});
