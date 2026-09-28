import { useState } from "react";
import { actions, uid } from "../lib/store";
import { LANGUAGE_NAMES } from "../../shared/content";
import type { ExplainStyle, Language, Motivation, Subject, Twin } from "../../shared/types";

// Twin creation is the first IKEA-effect moment (brief §18): the learner
// builds the Twin before the Twin teaches anything.
const COLOURS = ["#5eead4", "#a5b4fc", "#fbbf24", "#f472b6", "#86efac", "#fb923c"];
const STYLES: { id: ExplainStyle; label: string; blurb: string }[] = [
  { id: "step-by-step", label: "Step by step", blurb: "Numbered steps, no skipping." },
  { id: "simple", label: "Keep it simple", blurb: "Plain words, short sentences." },
  { id: "visual", label: "Show me", blurb: "Pictures, diagrams, number lines." },
  { id: "analogy", label: "Real-life examples", blurb: "Taxis, soccer, spaza maths." },
  { id: "practice-first", label: "Let me try first", blurb: "Problem first, then explain." },
  { id: "socratic", label: "Ask me questions", blurb: "You do the thinking." },
];
const MOTIVATIONS: { id: Motivation; label: string }[] = [
  { id: "encouragement", label: "Cheer me on" }, { id: "goals", label: "Track my goals" },
  { id: "curiosity", label: "Show me why" }, { id: "challenge", label: "Push me harder" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<7 | 8 | 9>(8);
  const [lang, setLang] = useState<Language>("en");
  const [subjects, setSubjects] = useState<Subject[]>(["maths", "english"]);
  const [goal, setGoal] = useState("");
  const [twin, setTwin] = useState<Twin>({ name: "", colour: COLOURS[0], personality: "energetic", explainStyle: "step-by-step", motivation: "encouragement" });

  const toggleSubject = (s: Subject) => setSubjects((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]));

  const finish = () => actions.createProfile({
    id: uid(), displayName: name.trim(), grade, homeLanguage: lang, subjects, goal: goal.trim() || "Get better every week",
    createdAt: new Date().toISOString(), twin: { ...twin, name: twin.name.trim() || "Twin" },
  });

  const steps = [
    <section key="you" className="space-y-5">
      <h1 className="text-3xl font-bold leading-tight">Hi. Let's build <span className="text-mint-300">your</span> learning system.</h1>
      <p className="text-slate-400">Three quick steps. You own everything you make here.</p>
      <label className="block space-y-1"><span className="text-sm text-slate-400">What should we call you?</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus /></label>
      <div className="space-y-1"><span className="text-sm text-slate-400">Grade</span>
        <div className="flex gap-2">{([7, 8, 9] as const).map((g) => <button key={g} className={`chip ${grade === g ? "chip-on" : ""}`} onClick={() => setGrade(g)}>Grade {g}</button>)}</div></div>
      <div className="space-y-1"><span className="text-sm text-slate-400">Home language</span>
        <div className="flex flex-wrap gap-2">{Object.entries(LANGUAGE_NAMES).map(([id, label]) => <button key={id} className={`chip ${lang === id ? "chip-on" : ""}`} onClick={() => setLang(id as Language)}>{label}</button>)}</div></div>
      <div className="space-y-1"><span className="text-sm text-slate-400">Subjects</span>
        <div className="flex gap-2">{(["maths", "english"] as Subject[]).map((s) => <button key={s} className={`chip capitalize ${subjects.includes(s) ? "chip-on" : ""}`} onClick={() => toggleSubject(s)}>{s}</button>)}</div></div>
      <button className="btn-primary w-full" disabled={!name.trim() || !subjects.length} onClick={() => setStep(1)}>Next</button>
    </section>,

    <section key="twin" className="space-y-5">
      <h1 className="text-3xl font-bold leading-tight">Now build your <span className="text-mint-300">Twin</span>.</h1>
      <p className="text-slate-400">Your Twin learns how you learn. Start by giving it a name and a colour.</p>
      <div className="card flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl text-3xl font-bold text-ink" style={{ background: twin.colour }}>{(twin.name || "?").slice(0, 1).toUpperCase()}</div>
        <input className="input flex-1" value={twin.name} onChange={(e) => setTwin({ ...twin, name: e.target.value })} placeholder="Twin's name" />
      </div>
      <div className="flex gap-3">{COLOURS.map((c) => <button key={c} aria-label={c} onClick={() => setTwin({ ...twin, colour: c })} className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-ink ${twin.colour === c ? "ring-2 ring-white" : ""}`} style={{ background: c }} />)}</div>
      <div className="space-y-1"><span className="text-sm text-slate-400">Personality</span>
        <div className="flex flex-wrap gap-2">{(["calm", "energetic", "playful", "direct"] as const).map((p) => <button key={p} className={`chip capitalize ${twin.personality === p ? "chip-on" : ""}`} onClick={() => setTwin({ ...twin, personality: p })}>{p}</button>)}</div></div>
      <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={() => setStep(0)}>Back</button><button className="btn-primary flex-1" disabled={!twin.name.trim()} onClick={() => setStep(2)}>Next</button></div>
    </section>,

    <section key="how" className="space-y-5">
      <h1 className="text-3xl font-bold leading-tight">How do you like to <span className="text-mint-300">learn</span>?</h1>
      <div className="grid grid-cols-2 gap-2">{STYLES.map((s) => (
        <button key={s.id} onClick={() => setTwin({ ...twin, explainStyle: s.id })} className={`card text-left ${twin.explainStyle === s.id ? "border-mint-400" : ""}`}>
          <div className="font-semibold">{s.label}</div><div className="text-xs text-slate-400">{s.blurb}</div></button>))}</div>
      <div className="space-y-1"><span className="text-sm text-slate-400">What keeps you going?</span>
        <div className="flex flex-wrap gap-2">{MOTIVATIONS.map((m) => <button key={m.id} className={`chip ${twin.motivation === m.id ? "chip-on" : ""}`} onClick={() => setTwin({ ...twin, motivation: m.id })}>{m.label}</button>)}</div></div>
      <label className="block space-y-1"><span className="text-sm text-slate-400">One goal for this term (optional)</span>
        <input className="input" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Pass my maths test with 70%" /></label>
      <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={() => setStep(1)}>Back</button><button className="btn-primary flex-1" onClick={finish}>Start learning</button></div>
    </section>,
  ];

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pt-[max(env(safe-area-inset-top),24px)] pb-10">
      <div className="mb-6 flex items-center justify-between"><span className="text-xl font-bold">lenmo</span><span className="text-xs text-slate-500">Step {step + 1} of 3</span></div>
      {steps[step]}
    </div>
  );
}
