import { useSyncExternalStore } from "react";
import type { LearnerState, LearnerProfile, SessionRecord } from "../../shared/types";

const KEY = "lenmo.state.v1";
const EMPTY: LearnerState = { profile: null, mastery: {}, sessions: [], xp: 0, savedExplanations: [] };

let state: LearnerState = load();
const listeners = new Set<() => void>();

function load(): LearnerState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch { return EMPTY; }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode etc. */ }
}
function set(next: LearnerState) { state = next; persist(); listeners.forEach((l) => l()); }

export function useLearner(): LearnerState {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);
}

export const actions = {
  createProfile(profile: LearnerProfile) { set({ ...state, profile }); },
  updateTwin(patch: Partial<LearnerProfile["twin"]>) {
    if (!state.profile) return;
    set({ ...state, profile: { ...state.profile, twin: { ...state.profile.twin, ...patch } } });
  },
  // Simple Bayesian-ish update: recent evidence weighs more than old evidence.
  recordAnswer(conceptId: string, correct: boolean) {
    const m = state.mastery[conceptId] ?? { conceptId, score: 0.3, attempts: 0, correct: 0, lastSeen: "" };
    const alpha = 0.25;
    const score = Math.min(1, Math.max(0, m.score + alpha * ((correct ? 1 : 0) - m.score)));
    set({
      ...state,
      xp: state.xp + (correct ? 10 : 2),
      mastery: { ...state.mastery, [conceptId]: { conceptId, score, attempts: m.attempts + 1, correct: m.correct + (correct ? 1 : 0), lastSeen: new Date().toISOString() } },
    });
  },
  addSession(s: SessionRecord) { set({ ...state, sessions: [...state.sessions, s], xp: state.xp + (s.completed ? 15 : 0) }); },
  saveExplanation(conceptId: string, text: string) {
    set({ ...state, savedExplanations: [...state.savedExplanations, { conceptId, text, savedAt: new Date().toISOString() }] });
  },
  reset() { set(EMPTY); },
};

export const uid = () => Math.random().toString(36).slice(2, 10);
