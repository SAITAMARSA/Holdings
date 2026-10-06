import { demoReply } from "@/coach/demoProvider";
import { selectProvider } from "@/coach/server/providers";
import { CoachReply, CoachRequest } from "@/coach/types";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = CoachRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const req = parsed.data;
  const { provider, notice } = selectProvider();

  // Safety replies are deterministic regardless of provider.
  const safety = demoReply(req);
  if (safety.safety) return Response.json({ reply: safety, notice });

  try {
    const reply = CoachReply.parse(await provider.reply(req));
    return Response.json({ reply, notice });
  } catch {
    return Response.json({ reply: demoReply(req), notice: "The coach provider failed; showing a demo response." });
  }
}
