// Structured learner model. Stored as data, not chat history (brief §24).

export type Subject = "maths" | "english";
export type Language = "en" | "zu" | "xh" | "st" | "tn" | "af";
export type ExplainStyle = "step-by-step" | "simple" | "visual" | "analogy" | "practice-first" | "socratic";
export type Motivation = "encouragement" | "goals" | "curiosity" | "challenge";

export interface Twin {
  name: string;
  colour: string;            // accent hex chosen by the learner (IKEA effect)
  personality: "calm" | "energetic" | "playful" | "direct";
  explainStyle: ExplainStyle;
  motivation: Motivation;
}

export interface LearnerProfile {
  id: string;
  displayName: string;
  grade: 7 | 8 | 9;
  homeLanguage: Language;
  subjects: Subject[];
  goal: string;
  createdAt: string;
  twin: Twin;
}

export interface ConceptMastery {
  conceptId: string;
  score: number;             // 0..1 estimated mastery
  attempts: number;
  correct: number;
  lastSeen: string;
}

export interface SessionRecord {
  id: string;
  kind: "learn" | "challenge" | "study";
  subject?: Subject;
  conceptId?: string;
  startedAt: string;
  durationSec: number;
  correct?: number;
  total?: number;
  completed: boolean;
}

export interface LearnerState {
  profile: LearnerProfile | null;
  mastery: Record<string, ConceptMastery>;
  sessions: SessionRecord[];
  xp: number;
  savedExplanations: { conceptId: string; text: string; savedAt: string }[];
}

export interface Concept {
  id: string;
  subject: Subject;
  grade: 7 | 8 | 9;
  title: string;
  summary: string;
  prerequisites: string[];
  items: PracticeItem[];
}

export interface PracticeItem {
  id: string;
  prompt: string;
  options: string[];
  answer: number;            // index into options
  hint: string;
  explanation: string;
}

export interface TutorTurn { role: "user" | "assistant"; content: string }

export interface TutorRequest {
  profile: LearnerProfile;
  concept: Concept;
  masteryScore: number;
  weakConcepts: string[];
  history: TutorTurn[];
}
