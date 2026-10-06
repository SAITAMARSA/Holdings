"use client";

import { getExercise } from "@/domain/exercises";
import { plannedSessionFor } from "@/domain/plan";
import { daysSinceLastSession, weekSummary } from "@/domain/progress";
import type { AppData } from "@/domain/schema";
import { demoReply } from "./demoProvider";
import { CoachReply, type CoachContext, type CoachRequest, type QuickAction } from "./types";

/** Minimal, non-sensitive snapshot sent with each coach request. */
export function buildContext(data: AppData, today: string): CoachContext {
  const p = data.profile!;
  const s = plannedSessionFor(data, today);
  const week = weekSummary(data, today, today);
  return {
    name: p.name,
    experience: p.experience,
    displayDetail: p.displayDetail,
    goal: p.goal,
    today: {
      rest: !s,
      session: s
        ? {
            name: s.name,
            purpose: s.purpose,
            estMinutes: s.estMinutes,
            adjusted: s.source !== "plan",
            exercises: s.exercises.slice(0, 12).map((e) => {
              const ex = getExercise(e.exerciseId);
              return {
                id: e.exerciseId,
                name: ex?.name ?? "Exercise",
                sets: e.sets,
                min: e.target.min,
                max: e.target.max,
                unit: ex?.unit ?? "reps",
                restSec: e.restSec,
                why: ex?.why ?? "",
              };
            }),
          }
        : null,
    },
    week: { planned: week.plannedCount, showedUp: week.showedUp },
    mealsSetUp: Boolean(data.meals.prefs),
    memory: data.memory.slice(0, 50).map((m) => m.text),
    daysSinceLastSession: daysSinceLastSession(data, today),
  };
}

/**
 * Ask the server-side coach. If the server can't be reached (e.g. offline),
 * fall back to the same deterministic demo logic locally — still labelled demo.
 */
export async function askCoach(
  message: string,
  context: CoachContext,
  quickAction?: QuickAction,
): Promise<{ reply: CoachReply; notice?: string }> {
  const req: CoachRequest = { message, context, quickAction };
  try {
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { reply: unknown; notice?: string };
    // Validate: model output must never be trusted blindly.
    const reply = CoachReply.parse(json.reply);
    return { reply, notice: json.notice };
  } catch {
    return { reply: demoReply(req), notice: "Couldn't reach the server — showing an offline demo response." };
  }
}
