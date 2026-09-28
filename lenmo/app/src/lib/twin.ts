// The Twin's recommendation logic. Lives client-side so it works offline and
// costs nothing to run. The LLM handles conversation; this handles direction.
import { CONCEPTS } from "../../shared/content";
import type { Concept, LearnerState, Subject } from "../../shared/types";

export const masteryOf = (s: LearnerState, id: string) => s.mastery[id]?.score ?? 0;

export function conceptsFor(s: LearnerState, subject?: Subject): Concept[] {
  const grade = s.profile?.grade ?? 7;
  return CONCEPTS.filter((c) => c.grade <= grade && (!subject || c.subject === subject));
}

/** Next thing to learn: unmet prerequisites first, then the weakest unlocked concept. */
export function recommendNext(s: LearnerState): Concept | null {
  const pool = conceptsFor(s).filter((c) => s.profile?.subjects.includes(c.subject) ?? true);
  const unlocked = pool.filter((c) => c.prerequisites.every((p) => masteryOf(s, p) >= 0.6));
  if (!unlocked.length) return pool[0] ?? null;
  return [...unlocked].sort((a, b) => masteryOf(s, a.id) - masteryOf(s, b.id))[0];
}

export function weakConcepts(s: LearnerState): string[] {
  return Object.values(s.mastery).filter((m) => m.attempts >= 2 && m.score < 0.5).map((m) => m.conceptId);
}

export function streakDays(s: LearnerState): number {
  const days = new Set(s.sessions.map((x) => x.startedAt.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak++; d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function sessionsThisWeek(s: LearnerState): number {
  const weekAgo = Date.now() - 7 * 86400e3;
  return s.sessions.filter((x) => new Date(x.startedAt).getTime() > weekAgo && x.completed).length;
}

/** Learning Ownership Score inputs for one learner (brief §22). */
export function ownership(s: LearnerState) {
  const t = s.profile?.twin;
  const customized = Boolean(t && t.name.trim() && t.name !== "Twin");
  return { customized, activeThisWeek: sessionsThisWeek(s) >= 3 };
}
