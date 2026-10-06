import { demoProvider } from "../demoProvider";
import type { CoachProvider } from "../types";

/**
 * Server-only provider selection. API keys are read from server environment
 * variables here and never sent to the browser (no NEXT_PUBLIC_ prefix).
 *
 * To connect a real model later, implement `createLiveProvider` so that it:
 *  1. Sends the validated CoachRequest (message + minimal context) to the model.
 *  2. Asks for JSON matching CoachReply (text + actions) and validates it with
 *     zod before returning. Invalid actions are dropped, never executed.
 *  3. Keeps the safety rules: pain/injury messages must short-circuit to the
 *     demo provider's safety replies before any model call.
 */
export function createLiveProvider(): CoachProvider | null {
  // Intentionally not implemented in the prototype: no credentials are
  // required and no paid service is called.
  return null;
}

export interface ProviderSelection {
  provider: CoachProvider;
  /** Set when a live provider was requested but isn't available. */
  notice?: string;
}

export function selectProvider(env: Record<string, string | undefined> = process.env): ProviderSelection {
  const wanted = (env.COACH_PROVIDER ?? "demo").toLowerCase();
  if (wanted === "live") {
    const live = env.COACH_API_KEY ? createLiveProvider() : null;
    if (live) return { provider: live };
    return {
      provider: demoProvider,
      notice: "Live coach requested but not configured; using demo responses.",
    };
  }
  return { provider: demoProvider };
}
