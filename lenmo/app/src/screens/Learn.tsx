import { useEffect, useRef, useState } from "react";
import { actions, uid, useLearner } from "../lib/store";
import { conceptsFor, masteryOf, recommendNext, weakConcepts } from "../lib/twin";
import { streamTutor } from "../lib/api";
import type { Concept, TutorTurn } from "../../shared/types";

export default function Learn() {
  const learner = useLearner();
  const [concept, setConcept] = useState<Concept | null>(null);
  const next = recommendNext(learner);

  if (concept) return <Lesson concept={concept} onExit={() => setConcept(null)} />;

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-2xl font-bold">Hi {learner.profile!.displayName}.</h1>
        <p className="text-slate-400">{learner.profile!.twin.name} thinks you should do this next.</p>
      </div>
      {next && (
        <button onClick={() => setConcept(next)} className="card w-full text-left" style={{ borderColor: "var(--accent)" }}>
          <div className="text-xs uppercase tracking-wide text-slate-400">{next.subject} · Grade {next.grade}</div>
          <div className="mt-1 text-xl font-semibold">{next.title}</div>
          <div className="text-sm text-slate-400">{next.summary}</div>
          <Mastery value={masteryOf(learner, next.id)} />
        </button>
      )}
      {(["maths", "english"] as const).filter((s) => learner.profile!.subjects.includes(s)).map((s) => (
        <section key={s} className="space-y-2">
          <h2 className="font-semibold capitalize">{s}</h2>
          {conceptsFor(learner, s).map((c) => {
            const locked = !c.prerequisites.every((p) => masteryOf(learner, p) >= 0.6);
            return (
              <button key={c.id} disabled={locked} onClick={() => setConcept(c)} className="card flex w-full items-center justify-between text-left disabled:opacity-50">
                <div><div className="font-medium">{c.title}</div><div className="text-xs text-slate-400">{locked ? `Unlock by mastering ${c.prerequisites.join(", ")}` : c.summary}</div></div>
                <Ring value={masteryOf(learner, c.id)} />
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function Lesson({ concept, onExit }: { concept: Concept; onExit: () => void }) {
  const learner = useLearner();
  const [turns, setTurns] = useState<TutorTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<string>("");
  const startedAt = useRef(new Date());
  const bottom = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  const send = async (text: string, history: TutorTurn[]) => {
    const withUser: TutorTurn[] = [...history, { role: "user", content: text }];
    setTurns([...withUser, { role: "assistant", content: "" }]);
    setBusy(true);
    let reply = "";
    try {
      const r = await streamTutor({
        profile: learner.profile!, concept, masteryScore: masteryOf(learner, concept.id), weakConcepts: weakConcepts(learner), history: withUser,
      }, (chunk) => { reply += chunk; setTurns([...withUser, { role: "assistant", content: reply }]); });
      setMode(r.mode);
    } catch {
      setTurns([...withUser, { role: "assistant", content: "I couldn't reach the server. Check your connection and try again." }]);
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (sent.current) return; sent.current = true;
    void send(`Let's start ${concept.title}.`, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [turns]);

  const finish = () => {
    actions.addSession({ id: uid(), kind: "learn", subject: concept.subject, conceptId: concept.id, startedAt: startedAt.current.toISOString(), durationSec: Math.round((Date.now() - startedAt.current.getTime()) / 1000), completed: turns.length >= 4 });
    onExit();
  };

  const lastTwin = [...turns].reverse().find((t) => t.role === "assistant" && t.content);

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col pt-1">
      <div className="mb-2 flex items-center justify-between">
        <button className="text-sm text-slate-400" onClick={finish}>← Done</button>
        <div className="text-sm font-semibold">{concept.title}</div>
        {mode === "mock" || mode === "offline" ? <span className="text-[10px] text-amber-400">{mode}</span> : <span />}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {turns.slice(1).map((t, i) => (
          <div key={i} className={`max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${t.role === "user" ? "ml-auto bg-mint-400 text-ink" : "bg-ink-soft border border-ink-line"}`}>
            {t.content || <span className="animate-pulse text-slate-500">thinking…</span>}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {lastTwin && !busy && (
        <button className="mb-2 self-start text-xs text-slate-400 underline" onClick={() => actions.saveExplanation(concept.id, lastTwin.content)}>Save this explanation</button>
      )}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!input.trim() || busy) return; const t = input.trim(); setInput(""); void send(t, turns); }}>
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Ask ${learner.profile!.twin.name}…`} disabled={busy} />
        <button className="btn-primary" disabled={busy || !input.trim()}>Send</button>
      </form>
    </div>
  );
}

export function Mastery({ value }: { value: number }) {
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-line">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(value * 100)}%`, background: "var(--accent)" }} />
    </div>
  );
}

export function Ring({ value }: { value: number }) {
  const r = 14, c = 2 * Math.PI * r;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#2a2850" strokeWidth="4" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform="rotate(-90 18 18)" />
      <text x="18" y="21" textAnchor="middle" fontSize="9" fill="#cbd5e1">{Math.round(value * 100)}</text>
    </svg>
  );
}
