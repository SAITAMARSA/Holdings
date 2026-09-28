import type { TutorRequest } from "../../shared/types";

/** Streams the Twin's reply. Calls onChunk with each text fragment. */
export async function streamTutor(req: TutorRequest, onChunk: (t: string) => void, signal?: AbortSignal): Promise<{ mode: string }> {
  const res = await fetch("/api/tutor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`tutor ${res.status}`);
  const mode = res.headers.get("x-lenmo-mode") ?? "unknown";
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk(dec.decode(value, { stream: true }));
  }
  return { mode };
}
