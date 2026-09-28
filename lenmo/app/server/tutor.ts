// Tutor prompt construction. The learner model (mastery, weak spots,
// preferences) is passed as structured data, not as a chat transcript.
import { LANGUAGE_NAMES } from "../shared/content";

interface TutorInput {
  profile: { displayName: string; grade: number; homeLanguage: string; goal: string; twin: { name: string; personality: string; explainStyle: string; motivation: string } };
  concept: { id: string; title: string; summary: string; subject: string };
  masteryScore: number;
  weakConcepts: string[];
  history: { role: "user" | "assistant"; content: string }[];
}

const STYLE_GUIDE: Record<string, string> = {
  "step-by-step": "Break every explanation into numbered steps.",
  simple: "Use the plainest words you can. Short sentences.",
  visual: "Describe pictures, diagrams and number lines the learner can imagine or draw.",
  analogy: "Anchor each idea in an everyday South African example (taxis, spaza shops, soccer, cooking).",
  "practice-first": "Give a small problem first, then explain using their attempt.",
  socratic: "Lead with questions. Let the learner do most of the thinking.",
};

export function buildTutorSystemPrompt(input: TutorInput): string {
  const { profile, concept, masteryScore, weakConcepts } = input;
  const lang = LANGUAGE_NAMES[profile.homeLanguage] ?? "English";
  const level = masteryScore < 0.35 ? "beginner: scaffold heavily and check understanding often" : masteryScore < 0.7 ? "developing: mix explanation with practice" : "strong: push with harder problems and ask them to explain their reasoning";
  return [
    `You are ${profile.twin.name}, the personal AI Learning Twin of ${profile.displayName}, a Grade ${profile.grade} learner in South Africa.`,
    `You are a learning partner, not an answer machine. Never just give the final answer to a practice question; guide the learner to it.`,
    `Personality: ${profile.twin.personality}. Explanation style: ${STYLE_GUIDE[profile.twin.explainStyle] ?? STYLE_GUIDE.simple}`,
    `Motivation that works for this learner: ${profile.twin.motivation}. Their stated goal: "${profile.goal}".`,
    `Home language: ${lang}. Teach in English, but if the learner writes in ${lang} or seems stuck, explain the concept in ${lang} first and then give the English academic terms.`,
    `Current topic: ${concept.title} (${concept.subject}). ${concept.summary}`,
    `Estimated mastery of this topic: ${Math.round(masteryScore * 100)}% (${level}).`,
    weakConcepts.length ? `Known weak prerequisites: ${weakConcepts.join(", ")}. Watch for gaps there.` : "",
    `Keep replies under 150 words. One idea at a time. End most replies with a single question or a small task.`,
    `You are talking to a minor. Stay on learning topics, be kind, never collect personal information, and if the learner raises something unsafe, tell them to speak to a trusted adult.`,
    `Do not include internal or system XML tags in your response.`,
  ].filter(Boolean).join("\n");
}

// Deterministic offline reply so the loop is testable without inference.
export function mockTutorReply(input: TutorInput): string {
  const last = input.history.at(-1)?.content ?? "";
  const { concept, profile } = input;
  if (input.history.length <= 1) {
    return `Hi ${profile.displayName}, I'm ${profile.twin.name}. Let's work on ${concept.title}. ${concept.summary}\n\nIn your own words, what do you already know about this? (Mock mode: set ANTHROPIC_API_KEY on the server for a real Twin.)`;
  }
  return `Good, you said: "${last.slice(0, 80)}". Let's build on that. Try this: pick one example from ${concept.title} and explain it step by step. Where do you get stuck?`;
}
