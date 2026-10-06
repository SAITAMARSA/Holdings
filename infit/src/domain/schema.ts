import { z } from "zod";

/**
 * Typed data model for Infit. Zod schemas are the single source of truth:
 * TypeScript types are inferred from them and persisted data is validated
 * against them on load, so a corrupted or outdated browser store can never
 * crash the app.
 */

export const SCHEMA_VERSION = 1;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timestamp = z.number().int().nonnegative();
const id = z.string().min(1).max(80);

// ---------------------------------------------------------------- enums

export const Experience = z.enum(["new", "experienced"]);
export type Experience = z.infer<typeof Experience>;

/** How much training detail to show. Independent of experience. */
export const DisplayDetail = z.enum(["simple", "detailed"]);
export type DisplayDetail = z.infer<typeof DisplayDetail>;

export const Goal = z.enum(["habit", "strength", "muscle", "fitness"]);
export type Goal = z.infer<typeof Goal>;

export const TrainingLocation = z.enum(["home", "gym", "both"]);
export type TrainingLocation = z.infer<typeof TrainingLocation>;

export const Limitation = z.enum(["knees", "lower-back", "shoulders", "wrists"]);
export type Limitation = z.infer<typeof Limitation>;

export const Intensity = z.enum(["gentle", "standard", "challenging"]);
export type Intensity = z.infer<typeof Intensity>;

export const Equipment = z.enum([
  "dumbbells",
  "kettlebell",
  "barbell",
  "bench",
  "machines",
  "cable",
  "pullup-bar",
  "resistance-band",
  "cardio-machine",
]);
export type Equipment = z.infer<typeof Equipment>;

export const Pattern = z.enum([
  "squat",
  "hinge",
  "lunge",
  "push-h",
  "push-v",
  "pull-h",
  "pull-v",
  "core",
  "conditioning",
]);
export type Pattern = z.infer<typeof Pattern>;

export const TwinColor = z.enum(["violet", "aqua", "coral", "sunshine", "mint", "sky", "berry", "slate"]);
export type TwinColor = z.infer<typeof TwinColor>;

export const TwinMode = z.enum(["supportive", "competitive"]);
export type TwinMode = z.infer<typeof TwinMode>;

export const WeightUnit = z.enum(["kg", "lb"]);
export type WeightUnit = z.infer<typeof WeightUnit>;

const weekday = z.number().int().min(0).max(6);

// ---------------------------------------------------------------- profile

export const Profile = z.object({
  name: z.string().trim().min(1).max(40),
  experience: Experience,
  displayDetail: DisplayDetail,
  goal: Goal,
  location: TrainingLocation,
  daysPerWeek: z.number().int().min(1).max(6),
  sessionMinutes: z.number().int().min(10).max(90),
  trainingDays: z.array(weekday).max(7),
  limitations: z.array(Limitation),
  /** "skipped" means we know nothing about limitations — we say so in the UI. */
  limitationsStatus: z.enum(["answered", "skipped"]),
  intensity: Intensity,
  /** Exercises the user asked to keep out of their plan. */
  avoidExercises: z.array(id),
  /** Exercises the user chose as replacements; preferred when they fit. */
  preferredExercises: z.array(id),
  units: WeightUnit,
  showNutritionDetail: z.boolean(),
  createdAt: timestamp,
});
export type Profile = z.infer<typeof Profile>;

export const EquipmentProfile = z.object({
  id,
  name: z.string().min(1).max(40),
  kind: z.enum(["home", "gym"]),
  equipment: z.array(Equipment),
  /** True once the user has confirmed what is there (vs. our default guess). */
  confirmed: z.boolean(),
});
export type EquipmentProfile = z.infer<typeof EquipmentProfile>;

// ---------------------------------------------------------------- onboarding

export const OnboardingDraft = z.object({
  step: z.number().int().min(0).max(20),
  answers: z.object({
    name: z.string().max(40).optional(),
    experience: Experience.optional(),
    goal: Goal.optional(),
    location: TrainingLocation.optional(),
    daysPerWeek: z.number().int().min(1).max(6).optional(),
    sessionMinutes: z.number().int().min(10).max(90).optional(),
    limitations: z.array(Limitation).optional(),
    limitationsStatus: z.enum(["answered", "skipped"]).optional(),
    twinColor: TwinColor.optional(),
    twinNickname: z.string().max(24).optional(),
  }),
});
export type OnboardingDraft = z.infer<typeof OnboardingDraft>;

// ---------------------------------------------------------------- plans

export const RepTarget = z.object({
  min: z.number().int().min(1).max(300),
  max: z.number().int().min(1).max(300),
});
export type RepTarget = z.infer<typeof RepTarget>;

export const PlannedExercise = z.object({
  slotId: id,
  exerciseId: id,
  pattern: Pattern,
  sets: z.number().int().min(1).max(10),
  target: RepTarget,
  restSec: z.number().int().min(0).max(600),
  /** 1 = main lift (kept longest when time is short), 3 = accessory. */
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});
export type PlannedExercise = z.infer<typeof PlannedExercise>;

export const SessionTemplate = z.object({
  id,
  name: z.string(),
  purpose: z.string(),
  exercises: z.array(PlannedExercise),
});
export type SessionTemplate = z.infer<typeof SessionTemplate>;

export const PlanSettings = z.object({
  experience: Experience,
  goal: Goal,
  location: TrainingLocation,
  sessionMinutes: z.number().int(),
  trainingDays: z.array(weekday),
  limitations: z.array(Limitation),
  intensity: Intensity,
  avoidExercises: z.array(id),
  preferredExercises: z.array(id),
  equipment: z.array(Equipment),
});
export type PlanSettings = z.infer<typeof PlanSettings>;

export const Plan = z.object({
  id,
  version: z.number().int().min(1),
  createdAt: timestamp,
  /** Plain-language reason this version exists. */
  reason: z.string(),
  effectiveFrom: isoDate,
  settings: PlanSettings,
  templates: z.array(SessionTemplate),
  /** Index 0 = Monday. null = planned rest day. */
  schedule: z.array(id.nullable()).length(7),
});
export type Plan = z.infer<typeof Plan>;

export const PlannedSession = z.object({
  date: isoDate,
  templateId: id,
  name: z.string(),
  purpose: z.string(),
  exercises: z.array(PlannedExercise),
  estMinutes: z.number().int(),
  /** Where this version came from. */
  source: z.enum(["plan", "adjusted", "ramp"]),
  revisionId: id.optional(),
  location: z.enum(["home", "gym"]),
});
export type PlannedSession = z.infer<typeof PlannedSession>;

export const AdjustReason = z.enum([
  "less-time",
  "equipment-unavailable",
  "different-gym",
  "at-home",
  "too-difficult",
  "schedule-changed",
  "returning",
  "swap-exercise",
]);
export type AdjustReason = z.infer<typeof AdjustReason>;

/** A per-date override created by an accepted adjustment. */
export const DayOverride = z.object({
  date: isoDate,
  revisionId: id,
  session: PlannedSession.nullable(), // null = rest
});
export type DayOverride = z.infer<typeof DayOverride>;

export const ChangeItem = z.object({
  kind: z.enum(["removed", "replaced", "reduced", "easier", "moved", "rest", "added", "shorter-rest", "kept"]),
  text: z.string(),
});
export type ChangeItem = z.infer<typeof ChangeItem>;

export const PlanRevision = z.object({
  id,
  createdAt: timestamp,
  date: isoDate,
  reason: AdjustReason,
  scope: z.enum(["today", "future"]),
  title: z.string(),
  changes: z.array(ChangeItem),
  why: z.string(),
  preserved: z.string(),
  beforeMinutes: z.number().int().nullable(),
  afterMinutes: z.number().int().nullable(),
  before: PlannedSession.nullable(),
  after: PlannedSession.nullable(),
  planVersionBefore: z.number().int(),
  planVersionAfter: z.number().int(),
});
export type PlanRevision = z.infer<typeof PlanRevision>;

// ---------------------------------------------------------------- workouts

export const SetEntry = z.object({
  targetReps: z.number().int(),
  /** Value shown in the input; NOT a record of work until completed. */
  reps: z.number().int().min(0).max(999).nullable(),
  loadKg: z.number().min(0).max(1000).nullable(),
  completed: z.boolean(),
  completedAt: timestamp.nullable(),
});
export type SetEntry = z.infer<typeof SetEntry>;

export const ActiveExercise = z.object({
  slotId: id,
  exerciseId: id,
  replacedFromId: id.nullable(),
  restSec: z.number().int(),
  target: RepTarget,
  sets: z.array(SetEntry),
});
export type ActiveExercise = z.infer<typeof ActiveExercise>;

export const ActiveSession = z.object({
  id,
  date: isoDate,
  planned: PlannedSession,
  startedAt: timestamp,
  /** Wall-clock timestamps so timers survive backgrounding and reloads. */
  pausedAt: timestamp.nullable(),
  pausedMs: z.number().int().nonnegative(),
  currentIndex: z.number().int().min(0),
  exercises: z.array(ActiveExercise),
  rest: z
    .object({
      endsAt: timestamp,
      durationSec: z.number().int(),
      /** Remaining ms captured when paused mid-rest. */
      remainingMsAtPause: z.number().int().nullable(),
    })
    .nullable(),
  painReported: z.boolean(),
});
export type ActiveSession = z.infer<typeof ActiveSession>;

export const Difficulty = z.enum(["too-easy", "about-right", "too-hard"]);
export type Difficulty = z.infer<typeof Difficulty>;
export const Energy = z.enum(["low", "okay", "good"]);
export type Energy = z.infer<typeof Energy>;

export const CompletedSet = z.object({
  reps: z.number().int().min(0),
  loadKg: z.number().min(0).nullable(),
  targetReps: z.number().int(),
  completedAt: timestamp,
});
export type CompletedSet = z.infer<typeof CompletedSet>;

export const CompletedSession = z.object({
  id,
  date: isoDate,
  startedAt: timestamp,
  endedAt: timestamp,
  activeSeconds: z.number().int().nonnegative(),
  status: z.enum(["completed", "partial"]),
  name: z.string(),
  source: z.enum(["plan", "adjusted", "ramp"]),
  revisionId: id.nullable(),
  plannedMinutes: z.number().int(),
  plannedSets: z.number().int(),
  completedSets: z.number().int(),
  exercises: z.array(
    z.object({
      exerciseId: id,
      replacedFromId: id.nullable(),
      plannedSets: z.number().int(),
      sets: z.array(CompletedSet),
    }),
  ),
  difficulty: Difficulty.nullable(),
  energy: Energy.nullable(),
  painReported: z.boolean(),
  /** First session after a break of 10+ days. */
  isReturn: z.boolean(),
});
export type CompletedSession = z.infer<typeof CompletedSession>;

// ---------------------------------------------------------------- twin & rewards

export const RewardEvent = z.object({
  id,
  /** Idempotency key: the same achievement can never be awarded twice. */
  key: z.string().min(1).max(120),
  kind: z.enum(["session-complete", "session-partial", "comeback", "weekly-goal", "first-session"]),
  points: z.number().int().min(0).max(1000),
  label: z.string(),
  date: isoDate,
  createdAt: timestamp,
});
export type RewardEvent = z.infer<typeof RewardEvent>;

export const Twin = z.object({
  color: TwinColor,
  nickname: z.string().max(24),
  mode: TwinMode,
  equipped: z.array(id),
});
export type Twin = z.infer<typeof Twin>;

// ---------------------------------------------------------------- coach

export const CheckInKind = z.enum([
  "shorter-sessions",
  "too-hard-streak",
  "too-easy-streak",
  "welcome-back",
  "meal-setup",
]);
export type CheckInKind = z.infer<typeof CheckInKind>;

export const CheckInRecord = z.object({
  lastShownAt: timestamp.nullable(),
  snoozedUntil: timestamp.nullable(),
  resolvedAt: timestamp.nullable(),
  resolution: z.enum(["accepted", "dismissed"]).nullable(),
});
export type CheckInRecord = z.infer<typeof CheckInRecord>;

export const MemoryItem = z.object({
  id,
  text: z.string().trim().min(1).max(200),
  category: z.enum(["schedule", "training", "equipment", "food", "other"]),
  source: z.enum(["you-told-coach", "check-in", "adjustment"]),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type MemoryItem = z.infer<typeof MemoryItem>;

export const CoachAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("open-adjust"), reason: AdjustReason, label: z.string() }),
  z.object({ type: z.literal("navigate"), href: z.string().regex(/^\/[a-z/-]*$/), label: z.string() }),
  z.object({
    type: z.literal("propose-memory"),
    text: z.string().min(1).max(200),
    category: MemoryItem.shape.category,
    label: z.string(),
  }),
]);
export type CoachAction = z.infer<typeof CoachAction>;

export const CoachMessage = z.object({
  id,
  role: z.enum(["user", "coach"]),
  text: z.string().max(4000),
  createdAt: timestamp,
  /** "demo" responses are scripted; they are labelled as such in the UI. */
  source: z.enum(["user", "demo", "live"]),
  actions: z.array(CoachAction),
  safety: z.boolean(),
});
export type CoachMessage = z.infer<typeof CoachMessage>;

// ---------------------------------------------------------------- meals & explore

export const Currency = z.enum(["GBP", "USD", "EUR", "AUD", "CAD"]);
export type Currency = z.infer<typeof Currency>;

export const Diet = z.enum(["none", "vegetarian", "vegan", "pescatarian"]);
export type Diet = z.infer<typeof Diet>;

export const Allergen = z.enum(["nuts", "peanuts", "dairy", "gluten", "eggs", "soy", "fish", "shellfish", "sesame"]);
export type Allergen = z.infer<typeof Allergen>;

export const MealPreferences = z.object({
  currency: Currency,
  weeklyBudget: z.number().min(0).max(100000),
  people: z.number().int().min(1).max(12),
  diet: Diet,
  allergies: z.array(Allergen),
  cookingTime: z.enum(["quick", "medium", "relaxed"]),
  pantry: z.array(z.string().max(40)).max(60),
  updatedAt: timestamp,
});
export type MealPreferences = z.infer<typeof MealPreferences>;

// ---------------------------------------------------------------- root

export const AppData = z.object({
  version: z.literal(SCHEMA_VERSION),
  mode: z.enum(["user", "demo"]),
  onboarding: z.object({
    completed: z.boolean(),
    draft: OnboardingDraft,
  }),
  profile: Profile.nullable(),
  equipmentProfiles: z.array(EquipmentProfile),
  plan: Plan.nullable(),
  planHistory: z.array(Plan),
  overrides: z.array(DayOverride),
  revisions: z.array(PlanRevision),
  /** Days covered by an accepted "ease me back in" ramp. */
  ramp: z.object({ from: isoDate, until: isoDate }).nullable(),
  activeSession: ActiveSession.nullable(),
  sessions: z.array(CompletedSession),
  rewards: z.array(RewardEvent),
  twin: Twin,
  /** Dates where competitive pressure is paused (e.g. pain reported). */
  competitionPausedDates: z.array(isoDate),
  /** Progress comparisons start from the most recent baseline. */
  baselines: z.array(z.object({ date: isoDate, reason: z.string() })),
  checkIns: z.partialRecord(CheckInKind, CheckInRecord),
  lastCheckInShownAt: timestamp.nullable(),
  memory: z.array(MemoryItem),
  coachMessages: z.array(CoachMessage),
  meals: z.object({
    prefs: MealPreferences.nullable(),
    saved: z.array(id),
  }),
  explore: z.object({ saved: z.array(id) }),
  settings: z.object({
    reduceMotion: z.boolean(),
  }),
});
export type AppData = z.infer<typeof AppData>;
