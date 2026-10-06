import { z } from "zod";
import { CoachAction, DisplayDetail, Experience, Goal } from "@/domain/schema";

/**
 * Coach provider contract. The browser sends a minimal, non-sensitive
 * context snapshot; the server picks a provider. Providers return text plus
 * structured, validated action suggestions. Actions only ever OPEN previews
 * (e.g. the Adjust flow) — they can never write workout records or profile
 * data directly.
 */

export const QuickAction = z.enum(["explain-today", "adjust-week", "replace-exercise", "meals", "returning"]);
export type QuickAction = z.infer<typeof QuickAction>;

export const CoachContext = z.object({
  name: z.string().max(40),
  experience: Experience,
  displayDetail: DisplayDetail,
  goal: Goal,
  today: z.object({
    rest: z.boolean(),
    session: z
      .object({
        name: z.string(),
        purpose: z.string(),
        estMinutes: z.number(),
        adjusted: z.boolean(),
        exercises: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              sets: z.number(),
              min: z.number(),
              max: z.number(),
              unit: z.enum(["reps", "seconds"]),
              restSec: z.number(),
              why: z.string(),
            }),
          )
          .max(12),
      })
      .nullable(),
  }),
  week: z.object({ planned: z.number(), showedUp: z.number() }),
  mealsSetUp: z.boolean(),
  memory: z.array(z.string().max(200)).max(50),
  daysSinceLastSession: z.number().nullable(),
});
export type CoachContext = z.infer<typeof CoachContext>;

export const CoachRequest = z.object({
  message: z.string().trim().min(1).max(1000),
  quickAction: QuickAction.optional(),
  context: CoachContext,
});
export type CoachRequest = z.infer<typeof CoachRequest>;

export const CoachReply = z.object({
  text: z.string().min(1).max(4000),
  actions: z.array(CoachAction).max(4),
  source: z.enum(["demo", "live"]),
  safety: z.boolean(),
});
export type CoachReply = z.infer<typeof CoachReply>;

export interface CoachProvider {
  readonly id: "demo" | "live";
  reply(req: CoachRequest): Promise<CoachReply>;
}

export const QUICK_ACTIONS: { id: QuickAction; label: string; message: string }[] = [
  { id: "explain-today", label: "Explain today's workout", message: "Can you explain today's workout?" },
  { id: "adjust-week", label: "Adjust my week", message: "I need to adjust my week." },
  { id: "replace-exercise", label: "Replace an exercise", message: "I'd like to replace an exercise." },
  { id: "meals", label: "Help with meals", message: "Can you help me with meals?" },
  { id: "returning", label: "I'm coming back after a break", message: "I'm coming back after a break." },
];
