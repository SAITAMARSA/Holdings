import { completeOnboarding, createEmptyData, type OnboardingAnswers } from "../state";
import type { AppData } from "../schema";
import { fromISODate } from "../dates";
import { startSession, completeSet, finishSession, type FinishFeedback } from "../session";
import { plannedSessionFor } from "../plan";

/** Monday 5 Oct 2026 at noon local time. */
export const MONDAY = "2026-10-05";
export const at = (date: string, hour = 12) => {
  const d = fromISODate(date);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
};

export const beginnerAnswers: OnboardingAnswers = {
  name: "Sam",
  experience: "new",
  goal: "habit",
  location: "home",
  daysPerWeek: 3,
  sessionMinutes: 30,
  limitationsStatus: "skipped",
  twinColor: "violet",
  twinNickname: "Mika",
};

export const lifterAnswers: OnboardingAnswers = {
  name: "Alex",
  experience: "experienced",
  goal: "strength",
  location: "gym",
  daysPerWeek: 4,
  sessionMinutes: 60,
  limitations: ["lower-back"],
  limitationsStatus: "answered",
  twinColor: "aqua",
};

export function onboarded(answers: OnboardingAnswers = beginnerAnswers, date = MONDAY): AppData {
  return completeOnboarding(createEmptyData(), answers, at(date, 8));
}

/** Start the planned session for `date` and complete `sets` sets (all if omitted). */
export function doWorkout(data: AppData, date: string, opts: { sets?: number; feedback?: FinishFeedback } = {}): AppData {
  const planned = plannedSessionFor(data, date);
  if (!planned) throw new Error(`No session planned on ${date}`);
  let t = at(date, 18);
  let active = startSession(data, planned, t);
  const total = active.exercises.reduce((n, e) => n + e.sets.length, 0);
  const target = opts.sets ?? total;
  let done = 0;
  for (let i = 0; i < active.exercises.length; i++) {
    for (let j = 0; j < active.exercises[i].sets.length; j++) {
      if (done >= target) break;
      t += 60_000;
      active = completeSet(active, i, j, t);
      done++;
    }
  }
  const result = finishSession(
    { ...data, activeSession: active },
    opts.feedback ?? { difficulty: "about-right", energy: null },
    t + 60_000,
  );
  return result.data;
}
