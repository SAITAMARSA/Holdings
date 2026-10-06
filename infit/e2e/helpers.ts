import { expect, type Page } from "@playwright/test";
import { addDays, fromISODate, todayISO } from "../src/domain/dates";
import { plannedSessionFor } from "../src/domain/plan";
import type { AppData } from "../src/domain/schema";
import { completeSet, finishSession, startSession } from "../src/domain/session";
import { completeOnboarding, createEmptyData, type OnboardingAnswers } from "../src/domain/state";

export const USER_KEY = "infit:user:v1";

export async function onboard(
  page: Page,
  opts: { name?: string; experienced?: boolean; skipLimitations?: boolean } = {},
) {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "Let's get started" }).click();
  await page.getByLabel("Your preferred name").fill(opts.name ?? "Sam");
  await page.getByRole("button", { name: "Continue" }).click();
  if (opts.experienced) {
    await page.getByRole("button", { name: /I already train/ }).click();
    await page.getByRole("button", { name: /Get stronger/ }).click();
    await page.getByRole("button", { name: /At a gym/ }).click();
    await page.getByRole("radio", { name: /^4/ }).click();
    await page.getByRole("radio", { name: /^45/ }).click();
  } else {
    await page.getByRole("button", { name: /I'm new to fitness/ }).click();
    await page.getByRole("button", { name: /steady habit/ }).click();
    await page.getByRole("button", { name: /At home/ }).click();
    await page.getByRole("radio", { name: /^3/ }).click();
    await page.getByRole("radio", { name: /^30/ }).click();
  }
  if (opts.skipLimitations) {
    await page.getByRole("button", { name: "Skip for now" }).click();
  } else {
    await page.getByRole("button", { name: /Nothing to avoid/ }).click();
  }
  await page.getByRole("button", { name: "Continue" }).click(); // Twin step (defaults)
  await page.getByRole("button", { name: "Build my plan" }).click();
  await expect(page).toHaveURL(/\/today$/);
}

/** Seed stored data before the app loads (used for time-dependent scenarios). */
export async function seed(page: Page, data: AppData) {
  await page.addInitScript(
    ([key, value]) => {
      if (!window.sessionStorage.getItem("seeded")) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.setItem("seeded", "1");
      }
    },
    [USER_KEY, JSON.stringify(data)] as const,
  );
}

function at(date: string, hour: number) {
  const d = fromISODate(date);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

/** A beginner who signed up three weeks ago and last trained two weeks ago. */
export function returningUser(): AppData {
  const today = todayISO();
  const start = addDays(today, -21);
  const answers: OnboardingAnswers = {
    name: "Riley",
    experience: "new",
    goal: "habit",
    location: "home",
    daysPerWeek: 3,
    sessionMinutes: 30,
    limitationsStatus: "skipped",
    twinColor: "sky",
    twinNickname: "Bo",
  };
  let d = completeOnboarding(createEmptyData(), answers, at(start, 8));
  for (const date of [start, addDays(today, -14)]) {
    const planned = plannedSessionFor(d, date)!;
    let t = at(date, 18);
    let s = startSession(d, planned, t);
    s.exercises.forEach((ex, i) => ex.sets.forEach((_, j) => (s = completeSet(s, i, j, (t += 60_000)))));
    d = finishSession({ ...d, activeSession: s }, { difficulty: "about-right", energy: null }, t + 1000).data;
  }
  return d;
}

export async function completeSets(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    await page.getByRole("button", { name: /^Complete set \d+$/ }).first().click();
    // A rest timer starts after each set; skip it to keep the test fast.
    const skip = page.getByRole("button", { name: "Skip", exact: true });
    if (await skip.isVisible()) await skip.click();
  }
}

export async function stored(page: Page): Promise<AppData> {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "null"), USER_KEY);
}
