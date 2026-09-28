// Deterministic on-device Twin. Used by the server without an API key and by
// the app when the server is unreachable, so the loop never dead-ends offline.
export function mockTutorReply(input: { profile: { displayName: string; twin: { name: string } }; concept: { title: string; summary: string }; history: { content: string }[] }): string {
  const last = input.history.at(-1)?.content ?? "";
  const { concept, profile } = input;
  if (input.history.length <= 1) {
    return `Hi ${profile.displayName}, I'm ${profile.twin.name}. Let's work on ${concept.title}. ${concept.summary}\n\nIn your own words, what do you already know about this? (Offline Twin: connect to the Lenmo server for a real conversation.)`;
  }
  return `Good, you said: "${last.slice(0, 80)}". Let's build on that. Try this: pick one example from ${concept.title} and explain it step by step. Where do you get stuck?`;
}
