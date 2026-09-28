import { useMemo, useRef, useState } from "react";
import { actions, uid, useLearner } from "../lib/store";
import { conceptsFor, masteryOf } from "../lib/twin";
import type { Concept, PracticeItem } from "../../shared/types";

// "Challenge your Twin": the Twin picks items around the learner's current
// level. Correct answers raise mastery; wrong ones lower it and show the hint.
export default function Challenge() {
  const learner = useLearner();
  const [round, setRound] = useState<{ concept: Concept; items: PracticeItem[] } | null>(null);
  const unlocked = conceptsFor(learner).filter((c) => learner.profile!.subjects.includes(c.subject) && c.prerequisites.every((p) => masteryOf(learner, p) >= 0.6));

  if (round) return <Round {...round} onDone={() => setRound(null)} />;

  const start = (c: Concept) => setRound({ concept: c, items: shuffle(c.items).slice(0, 4) });
  const mixed = () => {
    const items = shuffle(unlocked.flatMap((c) => c.items)).slice(0, 5);
    setRound({ concept: { ...unlocked[0], id: "mixed", title: "Mixed challenge", items }, items });
  };

  return (
    <div className="space-y-5 pt-2">
      <div><h1 className="text-2xl font-bold">Challenge {learner.profile!.twin.name}</h1>
        <p className="text-slate-400">Your Twin knows what you know. Prove it wrong.</p></div>
      <button className="btn-primary w-full" onClick={mixed} disabled={!unlocked.length}>⚡ Quick mixed round</button>
      <div className="space-y-2">
        {unlocked.map((c) => (
          <button key={c.id} onClick={() => start(c)} className="card flex w-full items-center justify-between text-left">
            <div><div className="font-medium">{c.title}</div><div className="text-xs capitalize text-slate-400">{c.subject} · {c.items.length} questions</div></div>
            <span className="text-sm text-slate-400">{Math.round(masteryOf(learner, c.id) * 100)}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Round({ concept, items, onDone }: { concept: Concept; items: PracticeItem[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const startedAt = useRef(new Date());
  const item = items[i];
  const conceptOf = useMemo(() => (id: string) => id.replace(/-\d+$/, ""), []);

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === item.answer;
    if (ok) setScore((s) => s + 1);
    actions.recordAnswer(conceptOf(item.id), ok);
  };
  const next = () => {
    if (i + 1 < items.length) { setI(i + 1); setPicked(null); return; }
    actions.addSession({ id: uid(), kind: "challenge", subject: concept.subject, conceptId: concept.id, startedAt: startedAt.current.toISOString(), durationSec: Math.round((Date.now() - startedAt.current.getTime()) / 1000), correct: score, total: items.length, completed: true });
    onDone();
  };

  if (!item) return null;
  const done = i + 1 === items.length && picked !== null;
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between text-sm text-slate-400"><button onClick={onDone}>← Quit</button><span>{i + 1} / {items.length}</span></div>
      <div className="h-1 w-full rounded-full bg-ink-line"><div className="h-full rounded-full bg-mint-400 transition-all" style={{ width: `${((i + (picked !== null ? 1 : 0)) / items.length) * 100}%` }} /></div>
      <h2 className="text-xl font-semibold leading-snug">{item.prompt}</h2>
      <div className="space-y-2">
        {item.options.map((o, idx) => {
          const state = picked === null ? "" : idx === item.answer ? "border-mint-400 bg-mint-400/15" : idx === picked ? "border-rose-400 bg-rose-400/15" : "opacity-50";
          return <button key={idx} onClick={() => choose(idx)} className={`card w-full text-left text-base ${state}`}>{o}</button>;
        })}
      </div>
      {picked !== null && (
        <div className="card text-sm">
          <div className="font-semibold">{picked === item.answer ? "Yes." : "Not quite."}</div>
          <div className="text-slate-300">{picked === item.answer ? item.explanation : `${item.hint} ${item.explanation}`}</div>
        </div>
      )}
      {picked !== null && <button className="btn-primary w-full" onClick={next}>{done ? `Finish · ${score}/${items.length}` : "Next"}</button>}
    </div>
  );
}

function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
