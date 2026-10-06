import { type ISODate, todayISO, weekdayOf } from "./dates";
import { defaultEquipmentProfiles, defaultTrainingDays, generatePlan, planSettingsFrom } from "./plan";
import { type AppData, type MemoryItem, type OnboardingDraft, type Profile, SCHEMA_VERSION } from "./schema";
import { uid } from "./uid";

export function createEmptyData(mode: AppData["mode"] = "user"): AppData {
  return {
    version: SCHEMA_VERSION,
    mode,
    onboarding: { completed: false, draft: { step: 0, answers: {} } },
    profile: null,
    equipmentProfiles: defaultEquipmentProfiles(),
    plan: null,
    planHistory: [],
    overrides: [],
    revisions: [],
    ramp: null,
    activeSession: null,
    sessions: [],
    rewards: [],
    twin: { color: "violet", nickname: "", mode: "supportive", equipped: [] },
    competitionPausedDates: [],
    baselines: [],
    checkIns: {},
    lastCheckInShownAt: null,
    memory: [],
    coachMessages: [],
    meals: { prefs: null, saved: [] },
    explore: { saved: [] },
    settings: { reduceMotion: false },
  };
}

export type OnboardingAnswers = OnboardingDraft["answers"];

export function isOnboardingComplete(a: OnboardingAnswers): boolean {
  return Boolean(
    a.name?.trim() &&
      a.experience &&
      a.goal &&
      a.location &&
      a.daysPerWeek &&
      a.sessionMinutes &&
      a.limitationsStatus &&
      a.twinColor,
  );
}

/** Turn onboarding answers into a profile, a first plan and a Twin. */
export function completeOnboarding(data: AppData, a: OnboardingAnswers, now: number): AppData {
  if (!isOnboardingComplete(a)) throw new Error("Onboarding is incomplete");
  const experience = a.experience!;
  const today = todayISO(new Date(now));
  const profile: Profile = {
    name: a.name!.trim().slice(0, 40),
    experience,
    // Beginners start with plain language; they can switch to detailed anytime.
    displayDetail: experience === "new" ? "simple" : "detailed",
    goal: a.goal!,
    location: a.location!,
    daysPerWeek: a.daysPerWeek!,
    sessionMinutes: a.sessionMinutes!,
    trainingDays: defaultTrainingDays(a.daysPerWeek!, weekdayOf(today)),
    limitations: a.limitationsStatus === "answered" ? (a.limitations ?? []) : [],
    limitationsStatus: a.limitationsStatus!,
    intensity: "standard",
    avoidExercises: [],
    preferredExercises: [],
    units: "kg",
    showNutritionDetail: false,
    createdAt: now,
  };
  const plan = generatePlan(planSettingsFrom(profile, data), {
    version: 1,
    reason: "Your first plan, built from your onboarding answers.",
    effectiveFrom: today,
    now,
  });
  return {
    ...data,
    onboarding: { completed: true, draft: { step: 0, answers: a } },
    profile,
    plan,
    planHistory: [],
    twin: {
      ...data.twin,
      color: a.twinColor!,
      nickname: (a.twinNickname ?? "").trim().slice(0, 24),
    },
  };
}

/** Archive the current plan and create a new version from the profile. */
export function regeneratePlan(data: AppData, reason: string, effectiveFrom: ISODate, now: number): AppData {
  if (!data.profile) return data;
  const version = (data.plan?.version ?? 0) + 1;
  const plan = generatePlan(planSettingsFrom(data.profile, data), { version, reason, effectiveFrom, now });
  return {
    ...data,
    plan,
    planHistory: data.plan ? [...data.planHistory, data.plan] : data.planHistory,
  };
}

export function addMemory(
  data: AppData,
  item: Pick<MemoryItem, "text" | "category" | "source">,
  now: number,
): AppData {
  // Replace an existing note with identical text rather than duplicating it.
  const existing = data.memory.find((m) => m.text.toLowerCase() === item.text.toLowerCase());
  if (existing) {
    return {
      ...data,
      memory: data.memory.map((m) => (m.id === existing.id ? { ...m, updatedAt: now } : m)),
    };
  }
  return {
    ...data,
    memory: [...data.memory, { ...item, id: uid("mem"), createdAt: now, updatedAt: now }],
  };
}

export function twinDisplayName(data: Pick<AppData, "twin">): string {
  return data.twin.nickname.trim() || "Your Twin";
}
