// Lenmo API. Keeps the Anthropic key server-side and streams tutor replies
// to the PWA as plain text chunks. Runs without a key in mock mode so the
// product loop can be tested offline and at zero inference cost.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildTutorSystemPrompt, mockTutorReply } from "./tutor.js";

const PORT = Number(process.env.PORT ?? 8787);
const MODEL = process.env.LENMO_MODEL ?? "claude-opus-5";
const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
const client = hasKey ? new Anthropic() : null;

const TurnSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) });
const RequestSchema = z.object({
  profile: z.object({
    displayName: z.string().max(60),
    grade: z.union([z.literal(7), z.literal(8), z.literal(9)]),
    homeLanguage: z.string().max(5),
    goal: z.string().max(200),
    twin: z.object({
      name: z.string().max(40),
      personality: z.string().max(20),
      explainStyle: z.string().max(20),
      motivation: z.string().max(20),
    }),
  }),
  concept: z.object({ id: z.string(), title: z.string(), summary: z.string(), subject: z.string() }),
  masteryScore: z.number().min(0).max(1),
  weakConcepts: z.array(z.string()).max(10),
  history: z.array(TurnSchema).max(30),
});

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 200_000) req.destroy(); });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function handleTutor(req: http.IncomingMessage, res: http.ServerResponse) {
  const parsed = RequestSchema.safeParse(JSON.parse((await readBody(req)) || "{}"));
  if (!parsed.success) {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "invalid request", issues: parsed.error.issues }));
    return;
  }
  const body = parsed.data;
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "x-lenmo-mode": hasKey ? "live" : "mock", "cache-control": "no-store" });

  if (!client) {
    res.end(mockTutorReply(body));
    return;
  }

  const system = buildTutorSystemPrompt(body);
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 1200,
    // Stable system prompt first so the cached prefix survives across turns.
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    messages: body.history.map((t) => ({ role: t.role, content: t.content })),
  });
  try {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") res.write(event.delta.text);
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") res.write("\n\nI can't help with that one here. Let's get back to the lesson.");
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) res.write("\n\nI'm a bit busy right now. Try again in a moment.");
    else if (err instanceof Anthropic.APIError) res.write(`\n\nSomething went wrong on my side (${err.status}).`);
    else res.write("\n\nI lost the connection. Let's try that again.");
    console.error("tutor error", err);
  }
  res.end();
}

const distDir = path.resolve("dist");
const mime: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json" };

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = (req.url ?? "/").split("?")[0];
  let file = path.join(distDir, url === "/" ? "index.html" : url);
  if (!file.startsWith(distDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(distDir, "index.html");
  res.writeHead(200, { "content-type": mime[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

http.createServer(async (req, res) => {
  try {
    if (req.url === "/api/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, mode: hasKey ? "live" : "mock", model: MODEL }));
    } else if (req.url === "/api/tutor" && req.method === "POST") {
      await handleTutor(req, res);
    } else if (process.env.NODE_ENV === "production" && fs.existsSync(distDir)) {
      serveStatic(req, res);
    } else {
      res.writeHead(404); res.end("not found");
    }
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500);
    res.end("server error");
  }
}).listen(PORT, () => {
  console.log(`lenmo api on :${PORT} (${hasKey ? "live: " + MODEL : "mock mode: set ANTHROPIC_API_KEY for real tutoring"})`);
});
