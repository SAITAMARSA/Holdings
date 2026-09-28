import { useState } from "react";
import { actions, useLearner } from "../lib/store";
import { conceptsFor, masteryOf, ownership, recommendNext, streakDays, sessionsThisWeek, weakConcepts } from "../lib/twin";
import { conceptById } from "../../shared/content";
import { Ring } from "./Learn";

// Meaningful progress, not vanity metrics (brief §7): mastery, consistency,
// weak spots, and what to do next.
export default function Progress() {
  const learner = useLearner();
  const [editing, setEditing] = useState(false);
  const concepts = conceptsFor(learner).filter((c) => learner.profile!.subjects.includes(c.subject));
  const mastered = concepts.filter((c) => masteryOf(learner, c.id) >= 0.8).length;
  const weak = weakConcepts(learner);
  const next = recommendNext(learner);
  const own = ownership(learner);
  const twin = learner.profile!.twin;

  return (
    <div className="space-y-5 pt-2">
      <h1 className="text-2xl font-bold">Progress</h1>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Mastered" value={`${mastered}/${concepts.length}`} />
        <Stat label="Streak" value={`${streakDays(learner)}d`} />
        <Stat label="Sessions this week" value={String(sessionsThisWeek(learner))} />
      </div>
      {next && <div className="card"><div className="text-xs uppercase tracking-wide text-slate-400">Recommended next</div><div className="font-semibold">{next.title}</div></div>}
      {weak.length > 0 && (
        <div className="card"><div className="text-xs uppercase tracking-wide text-amber-400">Needs attention</div>
          <ul className="mt-1 text-sm">{weak.map((id) => <li key={id}>{conceptById(id)?.title ?? id}</li>)}</ul></div>
      )}
      <section className="space-y-2">
        <h2 className="font-semibold">Concepts</h2>
        {concepts.map((c) => (
          <div key={c.id} className="card flex items-center justify-between"><div><div className="font-medium">{c.title}</div><div className="text-xs text-slate-400">{learner.mastery[c.id]?.attempts ?? 0} attempts</div></div><Ring value={masteryOf(learner, c.id)} /></div>
        ))}
      </section>
      {learner.savedExplanations.length > 0 && (
        <section className="space-y-2"><h2 className="font-semibold">Saved explanations</h2>
          {learner.savedExplanations.slice(-5).reverse().map((e, i) => <div key={i} className="card text-sm"><div className="text-xs text-slate-400">{conceptById(e.conceptId)?.title}</div><div className="whitespace-pre-wrap">{e.text}</div></div>)}</section>
      )}
      <section className="card space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Your Twin</h2><button className="text-sm text-mint-300" onClick={() => setEditing(!editing)}>{editing ? "Done" : "Edit"}</button></div>
        <div className="text-sm text-slate-400">{twin.name} · {twin.personality} · {twin.explainStyle} · {own.customized && own.activeThisWeek ? "You own this." : own.customized ? "3 sessions a week makes it yours." : "Give your Twin a name to make it yours."}</div>
        {editing && (
          <div className="space-y-2">
            <input className="input" value={twin.name} onChange={(e) => actions.updateTwin({ name: e.target.value })} />
            <div className="flex flex-wrap gap-2">{(["step-by-step", "simple", "visual", "analogy", "practice-first", "socratic"] as const).map((s) => <button key={s} className={`chip ${twin.explainStyle === s ? "chip-on" : ""}`} onClick={() => actions.updateTwin({ explainStyle: s })}>{s}</button>)}</div>
            <button className="text-xs text-rose-400" onClick={() => { if (confirm("Delete all your Lenmo data on this device?")) actions.reset(); }}>Reset everything</button>
          </div>
        )}
      </section>
      <p className="pb-2 text-center text-xs text-slate-600">XP {learner.xp} · all data stays on this device for now</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="card text-center"><div className="text-lg font-bold">{value}</div><div className="text-xs text-slate-400">{label}</div></div>;
}
