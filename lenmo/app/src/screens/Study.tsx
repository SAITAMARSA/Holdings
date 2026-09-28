import { useEffect, useRef, useState } from "react";
import { actions, uid, useLearner } from "../lib/store";
import { conceptsFor } from "../lib/twin";
import { startSound, type SoundKind } from "../lib/sound";

// Study Mode: choose sound → duration → topic → focus → reflect (brief §16).
// Sounds are synthesised with the Web Audio API, so no media downloads.
const SOUNDS: { id: SoundKind; label: string }[] = [
  { id: "silence", label: "Silence" }, { id: "rain", label: "Rain" }, { id: "white", label: "White noise" }, { id: "forest", label: "Forest" },
];
const DURATIONS = [10, 15, 25, 45];

export default function Study() {
  const learner = useLearner();
  const [sound, setSound] = useState<SoundKind>("rain");
  const [minutes, setMinutes] = useState(25);
  const [topic, setTopic] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(0);
  const [reflect, setReflect] = useState<null | { completed: boolean; secs: number }>(null);
  const stop = useRef<() => void>(() => {});
  const startedAt = useRef(new Date());
  const suggested = learner.sessions.filter((s) => s.kind === "study").slice(-3);
  const leftEarly = suggested.length >= 2 && suggested.every((s) => !s.completed);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => { if (running && left <= 0) end(true); }, [left, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const begin = () => {
    startedAt.current = new Date();
    setLeft(minutes * 60); setRunning(true);
    stop.current = startSound(sound);
  };
  const end = (completed: boolean) => {
    stop.current(); setRunning(false);
    const secs = Math.round((Date.now() - startedAt.current.getTime()) / 1000);
    actions.addSession({ id: uid(), kind: "study", conceptId: topic || undefined, startedAt: startedAt.current.toISOString(), durationSec: secs, completed });
    setReflect({ completed, secs });
  };

  if (reflect) return (
    <div className="space-y-4 pt-8 text-center">
      <div className="text-5xl">{reflect.completed ? "✦" : "◔"}</div>
      <h1 className="text-2xl font-bold">{reflect.completed ? "Session done." : "Stopped early, and that's fine."}</h1>
      <p className="text-slate-400">{Math.round(reflect.secs / 60)} focused minutes. {learner.profile!.twin.name} says: {reflect.completed ? "consistency beats intensity." : "a shorter session next time is a good move."}</p>
      <button className="btn-primary w-full" onClick={() => setReflect(null)}>Back</button>
    </div>
  );

  if (running) return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col items-center justify-center gap-6">
      <div className="text-xs uppercase tracking-widest text-slate-500">{topic ? conceptsFor(learner).find((c) => c.id === topic)?.title : "Focus"}</div>
      <div className="text-7xl font-bold tabular-nums">{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</div>
      <div className="text-sm text-slate-500">{SOUNDS.find((s) => s.id === sound)?.label}</div>
      <button className="btn-ghost" onClick={() => end(false)}>End early</button>
    </div>
  );

  return (
    <div className="space-y-5 pt-2">
      <div><h1 className="text-2xl font-bold">Study</h1><p className="text-slate-400">Build the habit. One focused block at a time.</p></div>
      {leftEarly && <div className="card text-sm text-amber-300">You've stopped early a few times. Try a 10 minute block. Finishing matters more than length.</div>}
      <div className="space-y-1"><span className="text-sm text-slate-400">Sound</span>
        <div className="flex flex-wrap gap-2">{SOUNDS.map((s) => <button key={s.id} className={`chip ${sound === s.id ? "chip-on" : ""}`} onClick={() => setSound(s.id)}>{s.label}</button>)}</div></div>
      <div className="space-y-1"><span className="text-sm text-slate-400">Minutes</span>
        <div className="flex gap-2">{DURATIONS.map((d) => <button key={d} className={`chip ${minutes === d ? "chip-on" : ""}`} onClick={() => setMinutes(d)}>{d}</button>)}</div></div>
      <div className="space-y-1"><span className="text-sm text-slate-400">Topic (optional)</span>
        <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">Anything</option>
          {conceptsFor(learner).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select></div>
      <button className="btn-primary w-full" onClick={begin}>Start</button>
    </div>
  );
}
