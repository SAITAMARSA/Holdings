import type { TutorRequest } from "../../shared/types";
import { mockTutorReply } from "../../shared/mock";

/** Streams the Twin's reply. Calls onChunk with each text fragment. */
export async function streamTutor(req: TutorRequest, onChunk: (t: string) => void, signal?: AbortSignal): Promise<{ mode: string }> {
  let res: Response | null = null;
  try {
    res = await fetch("api/tutor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(req), signal });
  } catch { res = null; }
  if (!res || !res.ok || !res.body) {
    // No server reachable: fall back to the on-device Twin so learning continues offline.
    onChunk(mockTutorReply(req));
    return { mode: "offline" };
  }
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
