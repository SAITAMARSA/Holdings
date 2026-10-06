import { addDays, type ISODate, weekdayOf } from "./dates";
import { DEFAULT_GYM_EQUIPMENT, DEFAULT_HOME_EQUIPMENT, getExercise, pickExercise } from "./exercises";
import type {
  AppData,
  ChangeItem,
  EquipmentProfile,
  Goal,
  Intensity,
  Pattern,
  Plan,
  PlannedExercise,
  PlannedSession,
  PlanSettings,
  Profile,
  SessionTemplate,
} from "./schema";
import { uid } from "./uid";

// ---------------------------------------------------------------- schedule

export const DEFAULT_TRAINING_DAYS: Record<number, number[]> = {
  1: [2],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

/**
 * Default training days, rotated so the first session falls on `startWeekday`
 * (the day the user signs up) — new users get a workout straight away rather
 * than a rest day.
 */
export function defaultTrainingDays(daysPerWeek: number, startWeekday = 0): number[] {
  const base = DEFAULT_TRAINING_DAYS[Math.min(6, Math.max(1, daysPerWeek))];
  const shift = startWeekday - base[0];
  return base.map((d) => (((d + shift) % 7) + 7) % 7).sort((a, b) => a - b);
}

// ---------------------------------------------------------------- equipment

export function equipmentProfileFor(data: Pick<AppData, "equipmentProfiles">, kind: "home" | "gym"): EquipmentProfile {
  return (
    data.equipmentProfiles.find((p) => p.kind === kind) ?? {
      id: `default-${kind}`,
      name: kind === "home" ? "Home" : "My gym",
      kind,
      equipment: kind === "home" ? DEFAULT_HOME_EQUIPMENT : DEFAULT_GYM_EQUIPMENT,
      confirmed: false,
    }
  );
}

export function defaultEquipmentProfiles(): EquipmentProfile[] {
  return [
    { id: "home", name: "Home", kind: "home", equipment: [...DEFAULT_HOME_EQUIPMENT], confirmed: false },
    { id: "gym", name: "My gym", kind: "gym", equipment: [...DEFAULT_GYM_EQUIPMENT], confirmed: false },
  ];
}

/** "both" plans default to the gym; the user adjusts on home days. */
export function primaryLocation(location: Profile["location"]): "home" | "gym" {
  return location === "home" ? "home" : "gym";
}

// ---------------------------------------------------------------- templates

interface SlotDef {
  pattern: Pattern;
  priority: 1 | 2 | 3;
}

interface TemplateDef {
  key: string;
  name: string;
  purpose: string;
  slots: SlotDef[];
}

const FULL_A: TemplateDef = {
  key: "full-a",
  name: "Full body A",
  purpose: "All-round strength: legs, pushing and pulling in one session.",
  slots: [
    { pattern: "squat", priority: 1 },
    { pattern: "push-h", priority: 1 },
    { pattern: "pull-h", priority: 1 },
    { pattern: "hinge", priority: 2 },
    { pattern: "core", priority: 3 },
  ],
};

const FULL_B: TemplateDef = {
  key: "full-b",
  name: "Full body B",
  purpose: "All-round strength with a focus on hips, back and shoulders.",
  slots: [
    { pattern: "hinge", priority: 1 },
    { pattern: "pull-v", priority: 1 },
    { pattern: "push-v", priority: 2 },
    { pattern: "lunge", priority: 2 },
    { pattern: "core", priority: 3 },
  ],
};

const UPPER: TemplateDef = {
  key: "upper",
  name: "Upper body",
  purpose: "Pushing and pulling strength for chest, back, shoulders and arms.",
  slots: [
    { pattern: "push-h", priority: 1 },
    { pattern: "pull-h", priority: 1 },
    { pattern: "push-v", priority: 2 },
    { pattern: "pull-v", priority: 2 },
    { pattern: "core", priority: 3 },
  ],
};

const LOWER: TemplateDef = {
  key: "lower",
  name: "Lower body",
  purpose: "Leg and hip strength, plus balance on one leg.",
  slots: [
    { pattern: "squat", priority: 1 },
    { pattern: "hinge", priority: 1 },
    { pattern: "lunge", priority: 2 },
    { pattern: "core", priority: 3 },
  ],
};

const ENGINE: TemplateDef = {
  key: "engine",
  name: "Fitness & core",
  purpose: "Heart-and-lungs fitness with some core and single-leg work.",
  slots: [
    { pattern: "conditioning", priority: 1 },
    { pattern: "lunge", priority: 2 },
    { pattern: "core", priority: 2 },
    { pattern: "pull-h", priority: 3 },
  ],
};

function templateRotation(settings: PlanSettings): TemplateDef[] {
  const n = settings.trainingDays.length;
  if (settings.experience === "experienced" && n >= 4) {
    const base = [UPPER, LOWER, UPPER, LOWER];
    return n === 4 ? base : [...base, ENGINE, ENGINE].slice(0, n);
  }
  return Array.from({ length: n }, (_, i) => (i % 2 === 0 ? FULL_A : FULL_B));
}

// ---------------------------------------------------------------- prescription

interface Prescription {
  sets: number;
  min: number;
  max: number;
  restSec: number;
}

function prescription(
  experience: Profile["experience"],
  goal: Goal,
  priority: 1 | 2 | 3,
  unit: "reps" | "seconds",
  pattern: Pattern,
): Prescription {
  if (pattern === "conditioning") {
    return experience === "new"
      ? { sets: 4, min: 30, max: 30, restSec: 45 }
      : { sets: 6, min: 40, max: 40, restSec: 40 };
  }
  if (unit === "seconds") {
    return experience === "new"
      ? { sets: 2, min: 20, max: 30, restSec: 45 }
      : { sets: 3, min: 30, max: 45, restSec: 45 };
  }
  if (experience === "new") return { sets: 2, min: 8, max: 12, restSec: 60 };
  const table: Record<Goal, Record<1 | 2 | 3, Prescription>> = {
    strength: {
      1: { sets: 4, min: 5, max: 6, restSec: 150 },
      2: { sets: 3, min: 8, max: 10, restSec: 90 },
      3: { sets: 2, min: 10, max: 12, restSec: 60 },
    },
    muscle: {
      1: { sets: 3, min: 8, max: 10, restSec: 90 },
      2: { sets: 3, min: 10, max: 12, restSec: 75 },
      3: { sets: 2, min: 12, max: 15, restSec: 60 },
    },
    fitness: {
      1: { sets: 3, min: 10, max: 12, restSec: 60 },
      2: { sets: 3, min: 12, max: 15, restSec: 45 },
      3: { sets: 2, min: 12, max: 15, restSec: 45 },
    },
    habit: {
      1: { sets: 3, min: 8, max: 12, restSec: 75 },
      2: { sets: 3, min: 10, max: 12, restSec: 60 },
      3: { sets: 2, min: 10, max: 12, restSec: 60 },
    },
  };
  return table[goal][priority];
}

export function targetLevel(experience: Profile["experience"], intensity: Intensity): number {
  const base = experience === "new" ? 1 : 2;
  const delta = intensity === "gentle" ? -1 : intensity === "challenging" ? 1 : 0;
  return Math.min(3, Math.max(1, base + delta));
}

function buildTemplate(def: TemplateDef, index: number, settings: PlanSettings): SessionTemplate {
  const slots = [...def.slots];
  if (settings.goal === "fitness" && def.key !== "engine") {
    slots.push({ pattern: "conditioning", priority: 3 });
  }
  const level = targetLevel(settings.experience, settings.intensity);
  const exercises: PlannedExercise[] = [];
  for (const [i, slot] of slots.entries()) {
    const ex = pickExercise({
      pattern: slot.pattern,
      equipment: settings.equipment,
      limitations: settings.limitations,
      targetLevel: level,
      exclude: settings.avoidExercises,
      prefer: settings.preferredExercises,
    });
    if (!ex) continue; // nothing suitable — the slot is dropped rather than forced
    const p = prescription(settings.experience, settings.goal, slot.priority, ex.unit, slot.pattern);
    let sets = p.sets;
    if (settings.intensity === "gentle") sets = Math.max(1, sets - 1);
    if (settings.intensity === "challenging" && slot.priority === 1) sets += 1;
    exercises.push({
      slotId: `${def.key}-${index}-${i}`,
      exerciseId: ex.id,
      pattern: slot.pattern,
      sets,
      target: { min: p.min, max: p.max },
      restSec: p.restSec,
      priority: slot.priority,
    });
  }
  const fitted = fitToMinutes(exercises, settings.sessionMinutes).exercises;
  return { id: `${def.key}-${index}`, name: def.name, purpose: def.purpose, exercises: fitted };
}

// ---------------------------------------------------------------- duration

const SECONDS_PER_REP = 4;
const TRANSITION_SEC = 60;

export function workSeconds(exercises: readonly PlannedExercise[]): number {
  let total = 0;
  for (const pe of exercises) {
    const ex = getExercise(pe.exerciseId);
    const perSet = ex?.unit === "seconds" ? pe.target.max : Math.max(25, pe.target.max * SECONDS_PER_REP);
    total += pe.sets * perSet + Math.max(0, pe.sets - 1) * pe.restSec + TRANSITION_SEC;
  }
  return total;
}

/** Estimated minutes including a short warm-up and cool-down. */
export function estimateMinutes(exercises: readonly PlannedExercise[]): number {
  if (exercises.length === 0) return 0;
  const work = workSeconds(exercises);
  // Warm-up and cool-down scale with session size: ~3 min for short sessions, up to 8.
  const overhead = Math.min(8 * 60, Math.max(3 * 60, work * 0.25));
  return Math.max(5, Math.round((work + overhead) / 60));
}

/**
 * Trim a session to fit the time available while preserving its main
 * movements. Order: drop accessories, trim sets, shorten rests, then drop
 * secondary movements. Main (priority 1) movements are kept to the end.
 */
export function fitToMinutes(
  input: readonly PlannedExercise[],
  minutes: number,
): { exercises: PlannedExercise[]; changes: ChangeItem[] } {
  let exercises = input.map((e) => ({ ...e, target: { ...e.target } }));
  const changes: ChangeItem[] = [];
  const name = (e: PlannedExercise) => getExercise(e.exerciseId)?.name ?? "Exercise";
  const fits = () => estimateMinutes(exercises) <= minutes;

  const dropPriority = (priority: 3 | 2) => {
    for (let i = exercises.length - 1; i >= 0 && !fits(); i--) {
      if (exercises[i].priority === priority && exercises.length > 1) {
        changes.push({ kind: "removed", text: `Removed ${name(exercises[i])} for today` });
        exercises = exercises.filter((_, j) => j !== i);
      }
    }
  };
  const trimSets = (priority: 1 | 2, floor: number) => {
    let changed = true;
    while (!fits() && changed) {
      changed = false;
      for (const e of exercises) {
        if (fits()) break;
        if (e.priority === priority && e.sets > floor) {
          e.sets -= 1;
          changed = true;
        }
      }
    }
  };

  if (fits()) return { exercises, changes };
  dropPriority(3);
  const setsBefore = new Map(exercises.map((e) => [e.slotId, e.sets]));
  if (!fits()) trimSets(2, 2);
  if (!fits()) trimSets(1, 2);
  // Shorten rests gradually (15 s at a time, never below 45 s) so we trim
  // only as much as needed.
  let shortened = false;
  while (!fits() && exercises.some((e) => e.restSec > 45)) {
    for (const e of exercises) {
      if (e.restSec > 45) {
        e.restSec = Math.max(45, e.restSec - 15);
        shortened = true;
      }
    }
  }
  if (shortened) changes.push({ kind: "shorter-rest", text: "Shorter rests between sets" });
  if (!fits()) dropPriority(2);
  if (!fits()) trimSets(1, 1);
  for (const e of exercises) {
    const before = setsBefore.get(e.slotId);
    if (before !== undefined && e.sets < before) {
      changes.push({ kind: "reduced", text: `${name(e)}: ${before} → ${e.sets} sets` });
    }
  }
  return { exercises, changes };
}

// ---------------------------------------------------------------- plan

export function planSettingsFrom(profile: Profile, data: Pick<AppData, "equipmentProfiles">): PlanSettings {
  const loc = primaryLocation(profile.location);
  return {
    experience: profile.experience,
    goal: profile.goal,
    location: profile.location,
    sessionMinutes: profile.sessionMinutes,
    trainingDays: [...profile.trainingDays].sort((a, b) => a - b),
    limitations: profile.limitations,
    intensity: profile.intensity,
    avoidExercises: profile.avoidExercises,
    preferredExercises: profile.preferredExercises,
    equipment: equipmentProfileFor(data, loc).equipment,
  };
}

export function generatePlan(
  settings: PlanSettings,
  opts: { version: number; reason: string; effectiveFrom: ISODate; now: number },
): Plan {
  const rotation = templateRotation(settings);
  const templates = rotation.map((def, i) => buildTemplate(def, i, settings));
  const schedule: (string | null)[] = Array(7).fill(null);
  settings.trainingDays.forEach((day, i) => {
    schedule[day] = templates[i]?.id ?? null;
  });
  return {
    id: uid("plan"),
    version: opts.version,
    createdAt: opts.now,
    reason: opts.reason,
    effectiveFrom: opts.effectiveFrom,
    settings,
    templates,
    schedule,
  };
}

/** The plan version that applied on a given date (history is preserved). */
export function planForDate(data: Pick<AppData, "plan" | "planHistory">, date: ISODate): Plan | null {
  if (!data.plan) return null;
  if (date >= data.plan.effectiveFrom) return data.plan;
  // Nothing was planned before the user's first plan existed.
  return (
    [...data.planHistory].filter((p) => p.effectiveFrom <= date).sort((a, b) => b.version - a.version)[0] ?? null
  );
}

export function sessionFromTemplate(plan: Plan, template: SessionTemplate, date: ISODate): PlannedSession {
  return {
    date,
    templateId: template.id,
    name: template.name,
    purpose: template.purpose,
    exercises: template.exercises,
    estMinutes: estimateMinutes(template.exercises),
    source: "plan",
    location: primaryLocation(plan.settings.location),
  };
}

/** Gentler version used while easing back in after a break. */
export function easeSession(session: PlannedSession, data: Pick<AppData, "equipmentProfiles" | "profile">): PlannedSession {
  const limitations = data.profile?.limitations ?? [];
  const equipment = equipmentProfileFor(data, session.location).equipment;
  const exercises = session.exercises.map((pe) => {
    const ex = getExercise(pe.exerciseId);
    const easier =
      ex && ex.level > 1
        ? pickExercise({ pattern: pe.pattern, equipment, limitations, targetLevel: ex.level - 1 })
        : undefined;
    return {
      ...pe,
      exerciseId: easier?.id ?? pe.exerciseId,
      sets: Math.max(1, pe.sets - 1),
      restSec: Math.max(pe.restSec, 60),
    };
  });
  return { ...session, exercises, estMinutes: estimateMinutes(exercises), source: "ramp" };
}

/**
 * The single source of truth for "what is planned on this date" — used by
 * Today, the weekly schedule, the Twin and Progress, so they always agree.
 * Returns null for a rest day.
 */
export function plannedSessionFor(data: AppData, date: ISODate): PlannedSession | null {
  const override = [...data.overrides].reverse().find((o) => o.date === date);
  if (override) return override.session;
  const plan = planForDate(data, date);
  if (!plan) return null;
  const templateId = plan.schedule[weekdayOf(date)];
  const template = plan.templates.find((t) => t.id === templateId);
  if (!template) return null;
  const session = sessionFromTemplate(plan, template, date);
  if (data.ramp && date >= data.ramp.from && date <= data.ramp.until) return easeSession(session, data);
  return session;
}

export function nextPlannedDate(data: AppData, after: ISODate, horizon = 14): ISODate | null {
  for (let i = 1; i <= horizon; i++) {
    const d = addDays(after, i);
    if (plannedSessionFor(data, d)) return d;
  }
  return null;
}

export function totalSets(session: Pick<PlannedSession, "exercises">): number {
  return session.exercises.reduce((n, e) => n + e.sets, 0);
}
