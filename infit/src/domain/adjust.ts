import { addDays, formatLongDate, type ISODate, WEEKDAY_SHORT } from "./dates";
import { alternativesFor, easierVariant, EQUIPMENT_LABEL, getExercise, isAvailable, isSuitable, pickExercise } from "./exercises";
import {
  easeSession,
  equipmentProfileFor,
  estimateMinutes,
  fitToMinutes,
  nextPlannedDate,
  plannedSessionFor,
  targetLevel,
} from "./plan";
import type {
  AdjustReason,
  AppData,
  ChangeItem,
  Equipment,
  Intensity,
  PlannedExercise,
  PlannedSession,
  PlanRevision,
} from "./schema";
import { addMemory, regeneratePlan } from "./state";
import { uid } from "./uid";

/**
 * "Adjust today" — the signature feature. Each reason produces a structured
 * Proposal that the user previews. Nothing changes until applyProposal() is
 * called with the user's chosen scope. Every accepted change is recorded as a
 * PlanRevision with before/after snapshots, so the original plan is preserved.
 */

export type AdjustInput =
  | { reason: "less-time"; minutes: number }
  | { reason: "equipment-unavailable"; missing: Equipment[] }
  | { reason: "different-gym"; equipment: Equipment[] }
  | { reason: "at-home"; equipment: Equipment[] }
  | { reason: "too-difficult"; kind: "overall" }
  | { reason: "too-difficult"; kind: "exercise"; exerciseId: string }
  | { reason: "too-difficult"; kind: "pain" }
  | { reason: "schedule-changed"; action: "rest-today" }
  | { reason: "schedule-changed"; action: "move"; toDate: ISODate }
  | { reason: "schedule-changed"; action: "train-today" }
  | { reason: "schedule-changed"; action: "change-days"; days: number[] }
  | { reason: "returning"; away: "1-2w" | "2-4w" | "1m+" }
  | { reason: "swap-exercise"; exerciseId: string; replacementId: string };

export type Scope = "today" | "future";

export interface ScopeOption {
  scope: Scope;
  label: string;
  description: string;
}

export interface Proposal {
  input: AdjustInput;
  date: ISODate;
  title: string;
  before: PlannedSession | null;
  after: PlannedSession | null;
  /** Other dates affected (e.g. moving a session to Thursday). */
  extraOverrides: { date: ISODate; session: PlannedSession | null }[];
  changes: ChangeItem[];
  why: string;
  preserved: string;
  scopes: ScopeOption[];
  /** Safety guidance shown prominently (pain reports). */
  safety?: string;
  /** Extra opt-in toggles offered alongside the proposal. */
  options?: { rememberHomeEquipment?: boolean; offerFreshBaseline?: boolean };
}

export type ProposalResult = { ok: true; proposal: Proposal } | { ok: false; message: string };

export const REASON_LABEL: Record<AdjustReason, string> = {
  "less-time": "I have less time",
  "equipment-unavailable": "This equipment is unavailable",
  "different-gym": "I'm at a different gym",
  "at-home": "I'm training at home",
  "too-difficult": "This feels too difficult",
  "schedule-changed": "My schedule changed",
  returning: "I'm returning after a break",
  "swap-exercise": "Replace an exercise",
};

/** The reasons offered on the Adjust screen, in display order. */
export const ADJUST_REASONS: AdjustReason[] = [
  "less-time",
  "equipment-unavailable",
  "different-gym",
  "at-home",
  "too-difficult",
  "schedule-changed",
  "returning",
];

const exName = (id: string) => getExercise(id)?.name ?? "Exercise";

function adjusted(session: PlannedSession, exercises: PlannedExercise[], patch: Partial<PlannedSession> = {}): PlannedSession {
  return { ...session, ...patch, exercises, estMinutes: estimateMinutes(exercises), source: "adjusted" };
}

/** Re-pick exercises for a new equipment set, keeping each movement slot. */
function reequip(
  session: PlannedSession,
  equipment: readonly Equipment[],
  data: AppData,
): { exercises: PlannedExercise[]; changes: ChangeItem[] } {
  const limitations = data.profile?.limitations ?? [];
  const level = data.profile ? targetLevel(data.profile.experience, data.profile.intensity) : 1;
  const changes: ChangeItem[] = [];
  const exercises: PlannedExercise[] = [];
  for (const pe of session.exercises) {
    const current = getExercise(pe.exerciseId);
    if (current && isAvailable(current, equipment)) {
      exercises.push(pe);
      continue;
    }
    const replacement = pickExercise({
      pattern: pe.pattern,
      equipment,
      limitations,
      targetLevel: current?.level ?? level,
      exclude: data.profile?.avoidExercises,
      prefer: data.profile?.preferredExercises,
    });
    if (replacement) {
      // Swapping a loaded lift for a bodyweight move changes what reps mean,
      // so reset to a sensible bodyweight rep range.
      const target =
        replacement.unit === "seconds"
          ? { min: 20, max: 30 }
          : current?.loaded && !replacement.loaded
            ? { min: 8, max: 12 }
            : pe.target;
      exercises.push({ ...pe, exerciseId: replacement.id, target });
      changes.push({ kind: "replaced", text: `${exName(pe.exerciseId)} → ${replacement.name}` });
    } else {
      changes.push({ kind: "removed", text: `Removed ${exName(pe.exerciseId)} (no suitable swap with this equipment)` });
    }
  }
  return { exercises, changes };
}

function locationLabel(loc: "home" | "gym") {
  return loc === "home" ? "home" : "gym";
}

export interface ProposeContext {
  data: AppData;
  date: ISODate;
}

export function proposeAdjustment(ctx: ProposeContext, input: AdjustInput): ProposalResult {
  const { data, date } = ctx;
  if (!data.profile || !data.plan) return { ok: false, message: "Finish setting up your plan first." };
  if (data.activeSession && data.activeSession.date === date) {
    return { ok: false, message: "You have a workout in progress. Finish or discard it before adjusting today." };
  }
  const session = plannedSessionFor(data, date);
  const profile = data.profile;
  const needsSession = !(
    input.reason === "schedule-changed" &&
    (input.action === "train-today" || input.action === "change-days")
  );
  if (needsSession && !session) {
    return {
      ok: false,
      message:
        "Today is a rest day, so there's nothing to change. If your schedule changed you can do your next workout today instead.",
    };
  }
  const base = {
    input,
    date,
    before: session,
    extraOverrides: [] as Proposal["extraOverrides"],
  };

  switch (input.reason) {
    // ------------------------------------------------------------ less time
    case "less-time": {
      const s = session!;
      if (input.minutes >= s.estMinutes) {
        return { ok: false, message: `Today's workout already fits in about ${s.estMinutes} minutes — no change needed.` };
      }
      const { exercises, changes } = fitToMinutes(s.exercises, input.minutes);
      const after = adjusted(s, exercises);
      const kept = exercises.filter((e) => e.priority === 1).map((e) => exName(e.exerciseId));
      const scopes: ScopeOption[] = [
        { scope: "today", label: "Just today", description: "Your usual session length stays the same." },
      ];
      if (input.minutes < profile.sessionMinutes) {
        scopes.push({
          scope: "future",
          label: `Plan ${input.minutes}-minute sessions from now on`,
          description: "Future sessions are rebuilt to fit. You can change this later in settings.",
        });
      }
      return {
        ok: true,
        proposal: {
          ...base,
          title: `A ${after.estMinutes}-minute version of ${s.name}`,
          after,
          changes: changes.length ? changes : [{ kind: "reduced", text: "Slightly trimmed volume" }],
          why: `You have about ${input.minutes} minutes. We kept the main movements and trimmed the extras first.`,
          preserved: kept.length
            ? `Main movements kept: ${kept.join(", ")}.`
            : "The session still covers its main movement patterns at lower volume.",
          scopes,
        },
      };
    }

    // ------------------------------------------------------------ equipment unavailable
    case "equipment-unavailable": {
      const s = session!;
      if (input.missing.length === 0) return { ok: false, message: "Choose the equipment that isn't available." };
      const available = equipmentProfileFor(data, s.location).equipment.filter((e) => !input.missing.includes(e));
      const { exercises, changes } = reequip(s, available, data);
      if (changes.length === 0) {
        return { ok: false, message: "Today's workout doesn't use that equipment, so nothing needs to change." };
      }
      const missingLabel = input.missing.map((e) => EQUIPMENT_LABEL[e]).join(", ");
      return {
        ok: true,
        proposal: {
          ...base,
          title: `${s.name} without ${missingLabel.toLowerCase()}`,
          after: adjusted(s, exercises),
          changes,
          why: `${missingLabel} ${input.missing.length > 1 ? "aren't" : "isn't"} available, so each affected exercise was swapped for one that trains the same movement.`,
          preserved: "Same movement patterns, sets and reps wherever a swap was possible.",
          scopes: [
            { scope: "today", label: "Just today", description: "It's busy or out of order today." },
            {
              scope: "future",
              label: `My ${locationLabel(s.location)} doesn't have it`,
              description: `Remove it from your ${locationLabel(s.location)} equipment and update future sessions.`,
            },
          ],
        },
      };
    }

    // ------------------------------------------------------------ different gym / home
    case "different-gym":
    case "at-home": {
      const s = session!;
      const toHome = input.reason === "at-home";
      const { exercises, changes } = reequip(s, input.equipment, data);
      const where = toHome ? "home" : "this gym";
      const scopes: ScopeOption[] = [
        { scope: "today", label: "Just today", description: "Your usual plan stays the same." },
        toHome
          ? {
              scope: "future",
              label: "I'll train at home from now on",
              description: "Future sessions are built for your home equipment.",
            }
          : {
              scope: "future",
              label: "This is my regular gym now",
              description: "Save this equipment as your gym and update future sessions.",
            },
      ];
      return {
        ok: true,
        proposal: {
          ...base,
          title: `${s.name} at ${where}`,
          after: adjusted(s, exercises, { location: toHome ? "home" : "gym" }),
          changes: changes.length ? changes : [{ kind: "kept", text: "Everything in today's session works here" }],
          why: `Exercises were matched to the equipment at ${where}, keeping each movement where possible.`,
          preserved: "Same session focus and movement patterns.",
          scopes,
          options: toHome ? { rememberHomeEquipment: true } : undefined,
        },
      };
    }

    // ------------------------------------------------------------ too difficult
    case "too-difficult": {
      if (input.kind === "pain") {
        return {
          ok: true,
          proposal: {
            ...base,
            title: "Take today to recover",
            after: null,
            changes: [
              { kind: "rest", text: "Today becomes a rest day" },
              { kind: "kept", text: "Your Twin pauses any competition today" },
            ],
            why: "Pain is a signal to stop, not to push through. Resting today is the safest default.",
            preserved: "Your weekly plan and progress are unaffected. Nothing is counted as missed.",
            scopes: [{ scope: "today", label: "Rest today", description: "Only today changes." }],
            safety:
              "Infit can't assess pain or injuries. If pain is sharp, severe, or doesn't settle, stop exercising and speak to a qualified health professional. If you notice chest pain, dizziness or trouble breathing, seek urgent medical help.",
          },
        };
      }
      const s = session!;
      const equipment = equipmentProfileFor(data, s.location).equipment;
      const limitations = profile.limitations;
      if (input.kind === "exercise") {
        const target = s.exercises.find((e) => e.exerciseId === input.exerciseId);
        if (!target) return { ok: false, message: "That exercise isn't in today's workout." };
        const easier = easierVariant(target.exerciseId, equipment, limitations);
        const changes: ChangeItem[] = [];
        const exercises = s.exercises.map((pe) => {
          if (pe !== target) return pe;
          if (easier) {
            changes.push({ kind: "easier", text: `${exName(pe.exerciseId)} → ${easier.name}` });
            return { ...pe, exerciseId: easier.id };
          }
          const sets = Math.max(1, pe.sets - 1);
          const t = { min: Math.max(1, Math.round(pe.target.min * 0.7)), max: Math.max(1, Math.round(pe.target.max * 0.7)) };
          changes.push({
            kind: "reduced",
            text: `${exName(pe.exerciseId)}: fewer sets and reps (no easier variation available here)`,
          });
          return { ...pe, sets, target: t };
        });
        const scopes: ScopeOption[] = [{ scope: "today", label: "Just today", description: "Try it again next time." }];
        if (easier) {
          scopes.push({
            scope: "future",
            label: `Use ${easier.name} in future sessions`,
            description: "Your coach will remember this swap.",
          });
        }
        return {
          ok: true,
          proposal: {
            ...base,
            title: `An easier ${exName(target.exerciseId)}`,
            after: adjusted(s, exercises),
            changes,
            why: "An easier variation of the same movement lets you build strength with good control.",
            preserved: `You still train the same movement (${target.pattern.replace("-h", "").replace("-v", "")}).`,
            scopes,
          },
        };
      }
      // overall
      const changes: ChangeItem[] = [];
      const exercises = s.exercises.map((pe) => {
        const easier = easierVariant(pe.exerciseId, equipment, limitations);
        if (easier) changes.push({ kind: "easier", text: `${exName(pe.exerciseId)} → ${easier.name}` });
        const sets = Math.max(1, pe.sets - 1);
        return {
          ...pe,
          exerciseId: easier?.id ?? pe.exerciseId,
          sets,
          target: { min: pe.target.min, max: Math.max(pe.target.min, pe.target.max - 2) },
          restSec: Math.max(pe.restSec, 60),
        };
      });
      changes.push({ kind: "reduced", text: "One fewer set per exercise, with longer rests" });
      const gentler: Intensity | null =
        profile.intensity === "challenging" ? "standard" : profile.intensity === "standard" ? "gentle" : null;
      const scopes: ScopeOption[] = [{ scope: "today", label: "Just today", description: "Some days are harder than others." }];
      if (gentler) {
        scopes.push({
          scope: "future",
          label: "Make my plan gentler",
          description: "Future sessions use easier variations and fewer sets. You can raise this again later.",
        });
      }
      return {
        ok: true,
        proposal: {
          ...base,
          title: `A gentler ${s.name}`,
          after: adjusted(s, exercises),
          changes,
          why: "Easier variations, less volume and more rest — so you can finish feeling capable.",
          preserved: "Same movement patterns, so you still practise every part of the session.",
          scopes,
        },
      };
    }

    // ------------------------------------------------------------ schedule changed
    case "schedule-changed": {
      if (input.action === "rest-today") {
        const s = session!;
        return {
          ok: true,
          proposal: {
            ...base,
            title: "Make today a rest day",
            after: null,
            changes: [{ kind: "rest", text: `${s.name} is not scheduled today` }],
            why: "Life happens. Resting today is part of your plan, not a failure.",
            preserved: "Your Twin rests too, and this week's goal adjusts to match.",
            scopes: [{ scope: "today", label: "Just today", description: "Your regular training days stay the same." }],
          },
        };
      }
      if (input.action === "move") {
        const s = session!;
        if (input.toDate <= date) return { ok: false, message: "Choose a later day." };
        if (plannedSessionFor(data, input.toDate)) {
          return { ok: false, message: "That day already has a workout. Pick a rest day instead." };
        }
        const moved: PlannedSession = { ...s, date: input.toDate, source: "adjusted" };
        return {
          ok: true,
          proposal: {
            ...base,
            title: `Move ${s.name} to ${formatLongDate(input.toDate)}`,
            after: null,
            extraOverrides: [{ date: input.toDate, session: moved }],
            changes: [
              { kind: "moved", text: `${s.name} moves to ${formatLongDate(input.toDate)}` },
              { kind: "rest", text: "Today becomes a rest day" },
            ],
            why: "Moving the session keeps your week complete without doubling up.",
            preserved: "The same workout, just on a different day. Your Twin follows the new schedule.",
            scopes: [{ scope: "today", label: "Move it this time", description: "Your regular days stay the same." }],
          },
        };
      }
      if (input.action === "train-today") {
        if (session) return { ok: false, message: "You already have a workout planned today." };
        const next = nextPlannedDate(data, date, 6);
        if (!next) return { ok: false, message: "There's no upcoming workout this week to bring forward." };
        const upcoming = plannedSessionFor(data, next)!;
        const pulled: PlannedSession = { ...upcoming, date, source: "adjusted" };
        return {
          ok: true,
          proposal: {
            ...base,
            title: `Do ${upcoming.name} today`,
            after: pulled,
            extraOverrides: [{ date: next, session: null }],
            changes: [
              { kind: "moved", text: `${upcoming.name} moves from ${formatLongDate(next)} to today` },
              { kind: "rest", text: `${formatLongDate(next)} becomes a rest day` },
            ],
            why: "Bringing your next session forward keeps the week balanced.",
            preserved: "Same workout and the same number of sessions this week.",
            scopes: [{ scope: "today", label: "Bring it forward", description: "Your regular days stay the same." }],
          },
        };
      }
      // change-days
      const days = [...new Set(input.days)].sort((a, b) => a - b);
      if (days.length === 0) return { ok: false, message: "Choose at least one training day." };
      const label = days.map((d) => WEEKDAY_SHORT[d]).join(", ");
      return {
        ok: true,
        proposal: {
          ...base,
          title: `Train on ${label}`,
          after: session,
          changes: [
            { kind: "moved", text: `Training days: ${profile.trainingDays.map((d) => WEEKDAY_SHORT[d]).join(", ")} → ${label}` },
          ],
          why: "Your plan is rebuilt around the days that work for you now.",
          preserved: "Same goal, exercises and session length — only the days change.",
          scopes: [{ scope: "future", label: "Update my training days", description: "Applies from today onwards." }],
        },
      };
    }

    // ------------------------------------------------------------ returning
    case "returning": {
      const s = session!;
      let eased = easeSession(s, data);
      if (input.away !== "1-2w") {
        eased = {
          ...eased,
          exercises: eased.exercises.map((e) => ({ ...e, sets: Math.min(e.sets, 2) })),
        };
      }
      if (input.away === "1m+") {
        eased = { ...eased, exercises: eased.exercises.filter((e) => e.priority !== 3) };
      }
      const after = adjusted(s, eased.exercises);
      const changes: ChangeItem[] = [];
      s.exercises.forEach((pe) => {
        const now = after.exercises.find((e) => e.slotId === pe.slotId);
        if (!now) changes.push({ kind: "removed", text: `Skipping ${exName(pe.exerciseId)} for now` });
        else if (now.exerciseId !== pe.exerciseId)
          changes.push({ kind: "easier", text: `${exName(pe.exerciseId)} → ${exName(now.exerciseId)}` });
      });
      changes.push({ kind: "reduced", text: "Fewer sets with comfortable rests" });
      return {
        ok: true,
        proposal: {
          ...base,
          title: "Welcome back — an easier first session",
          after,
          changes,
          why: "After time away, starting lighter rebuilds confidence and lets your body readjust.",
          preserved: "Same movements as your plan, so you pick up where you left off.",
          scopes: [
            { scope: "today", label: "Just today", description: "Back to your usual plan next session." },
            {
              scope: "future",
              label: "Ease me back in this week",
              description: "Sessions for the next 7 days are a little lighter, then your plan returns to normal.",
            },
          ],
          options: { offerFreshBaseline: true },
        },
      };
    }

    // ------------------------------------------------------------ swap exercise
    case "swap-exercise": {
      const s = session!;
      const target = s.exercises.find((e) => e.exerciseId === input.exerciseId);
      if (!target) return { ok: false, message: "That exercise isn't in today's workout." };
      const replacement = getExercise(input.replacementId);
      const equipment = equipmentProfileFor(data, s.location).equipment;
      if (!replacement || replacement.pattern !== target.pattern) {
        return { ok: false, message: "Choose a replacement that trains the same movement." };
      }
      if (!isAvailable(replacement, equipment) || !isSuitable(replacement, profile.limitations)) {
        return { ok: false, message: "That replacement doesn't fit your equipment or limitations." };
      }
      const exercises = s.exercises.map((pe) =>
        pe === target
          ? {
              ...pe,
              exerciseId: replacement.id,
              target: replacement.unit === "seconds" ? { min: 20, max: 30 } : pe.target,
            }
          : pe,
      );
      return {
        ok: true,
        proposal: {
          ...base,
          title: `Swap in ${replacement.name}`,
          after: adjusted(s, exercises),
          changes: [{ kind: "replaced", text: `${exName(target.exerciseId)} → ${replacement.name}` }],
          why: "Both exercises train the same movement, so the session stays balanced.",
          preserved: "Same sets, rest and session purpose.",
          scopes: [
            { scope: "today", label: "Just today", description: "Back to the usual exercise next time." },
            {
              scope: "future",
              label: "Use it from now on",
              description: `${replacement.name} replaces ${exName(target.exerciseId)} in future sessions.`,
            },
          ],
        },
      };
    }
  }
}

/** Replacement options for a planned exercise (same movement, fits constraints). */
export function replacementOptions(data: AppData, session: PlannedSession, exerciseId: string) {
  const equipment = equipmentProfileFor(data, session.location).equipment;
  return alternativesFor(exerciseId, equipment, data.profile?.limitations ?? []);
}

// ---------------------------------------------------------------- apply

export interface ApplyOptions {
  rememberHomeEquipment?: boolean;
  freshBaseline?: boolean;
}

export function applyProposal(data: AppData, proposal: Proposal, scope: Scope, now: number, options: ApplyOptions = {}): AppData {
  if (!proposal.scopes.some((s) => s.scope === scope)) throw new Error(`Scope ${scope} not offered`);
  if (!data.profile || !data.plan) return data;
  const revisionId = uid("rev");
  const input = proposal.input;
  const planVersionBefore = data.plan.version;
  let next: AppData = data;
  const profile = { ...data.profile };
  let rebuild: string | null = null;
  const memories: { text: string; category: "schedule" | "training" | "equipment" }[] = [];

  // 1. Day overrides — today's revised session (and any other moved days).
  const isChangeDays = input.reason === "schedule-changed" && input.action === "change-days";
  const affected = isChangeDays ? [] : [{ date: proposal.date, session: proposal.after }, ...proposal.extraOverrides];
  const stamp = (s: PlannedSession | null) => (s ? { ...s, revisionId, source: "adjusted" as const } : null);
  next = {
    ...next,
    overrides: [
      ...next.overrides.filter((o) => !affected.some((a) => a.date === o.date)),
      ...affected.map((a) => ({ date: a.date, revisionId, session: stamp(a.session) })),
    ],
  };

  // 2. Opt-in side effects.
  if (input.reason === "at-home" && options.rememberHomeEquipment) {
    next = {
      ...next,
      equipmentProfiles: next.equipmentProfiles.map((p) =>
        p.kind === "home" ? { ...p, equipment: input.equipment, confirmed: true } : p,
      ),
    };
  }
  if (input.reason === "too-difficult" && input.kind === "pain") {
    next = { ...next, competitionPausedDates: [...new Set([...next.competitionPausedDates, proposal.date])] };
  }
  if (input.reason === "returning" && options.freshBaseline) {
    next = { ...next, baselines: [...next.baselines, { date: proposal.date, reason: "Returning after a break" }] };
  }

  // 3. Lasting changes (only when the user chose "future").
  if (scope === "future") {
    switch (input.reason) {
      case "less-time":
        profile.sessionMinutes = input.minutes;
        rebuild = `Sessions shortened to about ${input.minutes} minutes.`;
        memories.push({ text: `Prefers sessions of about ${input.minutes} minutes`, category: "schedule" });
        break;
      case "equipment-unavailable": {
        const loc = proposal.before?.location ?? "gym";
        next = {
          ...next,
          equipmentProfiles: next.equipmentProfiles.map((p) =>
            p.kind === loc ? { ...p, equipment: p.equipment.filter((e) => !input.missing.includes(e)), confirmed: true } : p,
          ),
        };
        rebuild = `Updated ${loc} equipment.`;
        memories.push({
          text: `No ${input.missing.map((e) => EQUIPMENT_LABEL[e].toLowerCase()).join(", ")} at ${loc === "home" ? "home" : "the gym"}`,
          category: "equipment",
        });
        break;
      }
      case "different-gym":
        next = {
          ...next,
          equipmentProfiles: next.equipmentProfiles.map((p) =>
            p.kind === "gym" ? { ...p, equipment: input.equipment, confirmed: true } : p,
          ),
        };
        rebuild = "Switched to a new regular gym.";
        memories.push({ text: "Changed to a new regular gym", category: "equipment" });
        break;
      case "at-home":
        profile.location = "home";
        next = {
          ...next,
          equipmentProfiles: next.equipmentProfiles.map((p) =>
            p.kind === "home" ? { ...p, equipment: input.equipment, confirmed: true } : p,
          ),
        };
        rebuild = "Now training at home.";
        memories.push({ text: "Trains at home", category: "schedule" });
        break;
      case "too-difficult":
        if (input.kind === "overall") {
          profile.intensity = profile.intensity === "challenging" ? "standard" : "gentle";
          rebuild = "Plan made gentler.";
          memories.push({ text: "Prefers a gentler pace for now", category: "training" });
        } else if (input.kind === "exercise") {
          const after = proposal.after?.exercises.find(
            (e) => proposal.before?.exercises.find((b) => b.slotId === e.slotId)?.exerciseId === input.exerciseId,
          );
          profile.avoidExercises = [...new Set([...profile.avoidExercises, input.exerciseId])];
          if (after) profile.preferredExercises = [...new Set([...profile.preferredExercises, after.exerciseId])];
          rebuild = `Swapped out ${exName(input.exerciseId)}.`;
          memories.push({ text: `Finds ${exName(input.exerciseId)} too hard for now`, category: "training" });
        }
        break;
      case "swap-exercise":
        profile.avoidExercises = [...new Set([...profile.avoidExercises, input.exerciseId])];
        profile.preferredExercises = [
          ...new Set([...profile.preferredExercises.filter((id) => id !== input.exerciseId), input.replacementId]),
        ];
        rebuild = `${exName(input.replacementId)} replaces ${exName(input.exerciseId)}.`;
        memories.push({
          text: `Prefers ${exName(input.replacementId)} over ${exName(input.exerciseId)}`,
          category: "training",
        });
        break;
      case "schedule-changed":
        if (input.action === "change-days") {
          const days = [...new Set(input.days)].sort((a, b) => a - b);
          profile.trainingDays = days;
          profile.daysPerWeek = days.length;
          rebuild = "Training days changed.";
          memories.push({
            text: `Trains on ${days.map((d) => WEEKDAY_SHORT[d]).join(", ")}`,
            category: "schedule",
          });
        }
        break;
      case "returning":
        next = { ...next, ramp: { from: proposal.date, until: addDays(proposal.date, 6) } };
        break;
    }
  }

  next = { ...next, profile };
  if (rebuild) next = regeneratePlan(next, rebuild, proposal.date, now);
  for (const m of memories) next = addMemory(next, { ...m, source: "adjustment" }, now);

  const revision: PlanRevision = {
    id: revisionId,
    createdAt: now,
    date: proposal.date,
    reason: input.reason,
    scope,
    title: proposal.title,
    changes: proposal.changes,
    why: proposal.why,
    preserved: proposal.preserved,
    beforeMinutes: proposal.before?.estMinutes ?? null,
    afterMinutes: proposal.after?.estMinutes ?? null,
    before: proposal.before,
    after: proposal.after,
    planVersionBefore,
    planVersionAfter: next.plan?.version ?? planVersionBefore,
  };
  return { ...next, revisions: [...next.revisions, revision] };
}

/** Undo today's adjustment by removing its overrides (history is kept). */
export function revertDay(data: AppData, date: ISODate): AppData {
  const override = data.overrides.find((o) => o.date === date);
  if (!override) return data;
  return { ...data, overrides: data.overrides.filter((o) => o.revisionId !== override.revisionId) };
}
