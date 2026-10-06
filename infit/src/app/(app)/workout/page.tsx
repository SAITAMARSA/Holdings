"use client";

import clsx from "clsx";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Info, Pause, Play, Repeat2, ShieldAlert, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clockText, fromDisplayLoad, loadText, range, targetText, toDisplayLoad } from "@/components/format";
import { Badge, Button, Card, Chip, EmptyState, IconButton, LinkButton, Notice, Sheet, Stepper } from "@/components/ui";
import { replacementOptions } from "@/domain/adjust";
import { formatLongDate } from "@/domain/dates";
import { EQUIPMENT_LABEL, exerciseOrStub, PATTERN_LABEL } from "@/domain/exercises";
import { plannedSessionFor } from "@/domain/plan";
import { bestSessionOn } from "@/domain/progress";
import type { ActiveSession, Difficulty, Energy } from "@/domain/schema";
import {
  canReplace,
  completeSet,
  discardSession,
  elapsedActiveMs,
  extendRest,
  finishSession,
  goToExercise,
  lastPerformance,
  pauseSession,
  replaceInSession,
  reportPain,
  restRemainingMs,
  resumeSession,
  sessionCounts,
  skipRest,
  startSession,
  uncompleteSet,
  updateSetValues,
} from "@/domain/session";
import { useNow, useToday } from "@/hooks/useClock";
import { now, useAppStore } from "@/store/appStore";

export default function WorkoutPage() {
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const today = useToday();
  const active = data.activeSession;

  if (active) return <ActiveWorkout session={active} />;

  const planned = plannedSessionFor(data, today);
  const done = bestSessionOn(data, today);
  return (
    <div className="flex flex-col gap-5 pt-4">
      <LinkButton href="/today" variant="ghost" className="self-start">
        <ArrowLeft className="size-5" aria-hidden /> Today
      </LinkButton>
      {planned && done?.status !== "completed" ? (
        <Card>
          <h1 className="text-2xl font-black">Ready for {planned.name}?</h1>
          <p className="mt-1 text-muted">About {planned.estMinutes} minutes · {planned.exercises.length} exercises</p>
          <Button size="lg" className="mt-4 w-full" onClick={() => update((d) => ({ ...d, activeSession: startSession(d, planned, now()) }))}>
            <Play className="size-5" aria-hidden /> Start workout
          </Button>
        </Card>
      ) : (
        <EmptyState title={planned ? "You've already finished today's workout" : "No workout planned today"}>
          {planned ? "Nice work. Rest up!" : "It's a rest day. You can bring your next session forward from Adjust today."}
        </EmptyState>
      )}
    </div>
  );
}

function ActiveWorkout({ session }: { session: ActiveSession }) {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const t = useNow(250);
  const today = useToday();
  const units = data.profile?.units ?? "kg";
  const detail = data.profile?.displayDetail ?? "simple";
  const [sheet, setSheet] = useState<null | "leave" | "pain" | "replace" | "finish" | "discard">(null);
  const [showHow, setShowHow] = useState(detail === "simple");
  const finishing = useRef(false);

  const set = (fn: (s: ActiveSession) => ActiveSession) =>
    update((d) => (d.activeSession ? { ...d, activeSession: fn(d.activeSession) } : d));

  const idx = Math.min(session.currentIndex, session.exercises.length - 1);
  const current = session.exercises[idx];
  const ex = exerciseOrStub(current.exerciseId);
  const paused = session.pausedAt !== null;
  const restMs = restRemainingMs(session, t);
  const { planned: plannedSets, done: doneSets } = sessionCounts(session);
  const previous = lastPerformance(data, current.exerciseId);
  const alternatives = replacementOptions(data, session.planned, current.exerciseId);
  const allDone = doneSets === plannedSets;
  const loadStep = units === "lb" ? 5 : 2.5;

  // Open the finish sheet automatically once every set is done.
  const prevAllDone = useRef(allDone);
  useEffect(() => {
    if (allDone && !prevAllDone.current) setSheet("finish");
    prevAllDone.current = allDone;
  }, [allDone]);

  const finish = (difficulty: Difficulty | null, energy: Energy | null) => {
    if (finishing.current) return;
    finishing.current = true;
    const saved: { id: string | null } = { id: null };
    update((d) => {
      const r = finishSession(d, { difficulty, energy }, now());
      saved.id = r.completed?.id ?? null;
      return r.data;
    });
    router.replace(saved.id ? `/workout/summary?id=${saved.id}` : "/today");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="sticky top-0 z-30 -mx-4 flex items-center gap-2 border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <IconButton label="Leave workout" onClick={() => setSheet("leave")}>
          <ArrowLeft className="size-6" />
        </IconButton>
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold leading-tight">{session.planned.name}</p>
          <p className="tabular text-sm text-muted" aria-label={`Active time ${clockText(elapsedActiveMs(session, t))}`}>
            {clockText(elapsedActiveMs(session, t))} · {doneSets}/{plannedSets} sets
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-coral-500/40 text-coral-700"
          onClick={() => {
            update(reportPain);
            setSheet("pain");
          }}
        >
          <ShieldAlert className="size-4" aria-hidden /> Pain
        </Button>
        <Button
          size="sm"
          variant={paused ? "primary" : "secondary"}
          onClick={() => set((s) => (paused ? resumeSession(s, now()) : pauseSession(s, now())))}
        >
          {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
          {paused ? "Resume" : "Pause"}
        </Button>
      </div>

      {session.date !== today && (
        <Notice tone="warning">This workout was started on {formatLongDate(session.date)}. It will be saved to that day.</Notice>
      )}

      {/* Exercise navigator */}
      <nav aria-label="Exercises" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {session.exercises.map((e, i) => {
          const d = e.sets.filter((s) => s.completed).length;
          const complete = d === e.sets.length;
          return (
            <button
              key={e.slotId}
              type="button"
              onClick={() => set((s) => goToExercise(s, i))}
              aria-current={i === idx ? "step" : undefined}
              aria-label={`${exerciseOrStub(e.exerciseId).name}: ${d} of ${e.sets.length} sets done`}
              className={clsx(
                "flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl border-2 px-3 text-sm font-extrabold",
                i === idx ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line bg-surface text-muted",
              )}
            >
              {complete ? <Check className="size-4 text-aqua-600" strokeWidth={3} aria-hidden /> : <span aria-hidden>{i + 1}</span>}
              <span className="max-w-28 truncate">{exerciseOrStub(e.exerciseId).name}</span>
            </button>
          );
        })}
      </nav>

      {/* Current exercise */}
      <Card className="relative" aria-labelledby="ex-name">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="brand">{PATTERN_LABEL[ex.pattern]}</Badge>
              {current.replacedFromId && <Badge tone="aqua">Replaced {exerciseOrStub(current.replacedFromId).name}</Badge>}
            </div>
            <h1 id="ex-name" className="mt-2 text-2xl font-black leading-tight">
              {ex.name}
            </h1>
            <p className="mt-1 font-bold text-muted">
              {targetText(current.sets.length, current.target, ex.unit, detail)}
              {detail === "detailed" && ` · rest ${current.restSec}s`}
            </p>
            <p className="mt-1 text-sm text-muted">
              Equipment: {ex.equipment.length ? ex.equipment.map((e) => EQUIPMENT_LABEL[e]).join(", ") : "none"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" aria-expanded={showHow} onClick={() => setShowHow((v) => !v)}>
            <Info className="size-4" aria-hidden /> {showHow ? "Hide how-to" : "How to do it"}
          </Button>
          <Button size="sm" variant="secondary" disabled={!canReplace(session, idx)} onClick={() => setSheet("replace")}>
            <Repeat2 className="size-4" aria-hidden /> Replace
          </Button>
        </div>
        {!canReplace(session, idx) && (
          <p className="mt-2 text-xs text-muted">Replacing is available before you complete a set of this exercise.</p>
        )}

        {showHow && (
          <div className="mt-3 rounded-2xl bg-sunken p-4 text-sm">
            <p className="font-bold">{ex.summary}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              {ex.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {ex.why && <p className="mt-2 text-muted">Why: {ex.why}</p>}
            <p className="mt-2 text-xs text-muted">Stop if anything hurts. No video is available in this prototype.</p>
          </div>
        )}

        {previous && (
          <p className="mt-3 text-sm text-muted">
            Last time: {previous.length} set{previous.length > 1 ? "s" : ""} · best{" "}
            {Math.max(...previous.map((p) => p.reps))}
            {ex.unit === "seconds" ? "s" : " reps"}
            {previous.some((p) => p.loadKg !== null) &&
              ` @ ${loadText(Math.max(...previous.map((p) => p.loadKg ?? 0)), units)}`}
            . Values below start from last time — edit before you tick.
          </p>
        )}

        {/* Sets */}
        <ol className="mt-4 flex flex-col gap-3" aria-label={`Sets for ${ex.name}`}>
          {current.sets.map((s, j) => (
            <li
              key={j}
              className={clsx(
                "rounded-2xl border-2 p-3 transition-colors",
                s.completed ? "border-aqua-300 bg-aqua-50" : "border-line bg-surface",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-extrabold">
                  Set {j + 1}
                  <span className="ml-2 text-sm font-bold text-muted">
                    target {range(current.target)}
                    {ex.unit === "seconds" ? "s" : ""}
                  </span>
                </p>
                {s.completed ? (
                  <Button size="sm" variant="ghost" onClick={() => set((x) => uncompleteSet(x, idx, j))} aria-label={`Undo set ${j + 1}`}>
                    <Undo2 className="size-4" aria-hidden /> Undo
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="aqua"
                    disabled={paused || s.reps === null}
                    onClick={() => set((x) => completeSet(x, idx, j, now()))}
                    aria-label={`Complete set ${j + 1}`}
                  >
                    <Check className="size-5" strokeWidth={3} aria-hidden /> Done
                  </Button>
                )}
              </div>
              <div className={clsx("mt-2 grid gap-2", ex.loaded ? "grid-cols-2" : "grid-cols-1")}>
                <div>
                  <span className="mb-1 block text-xs font-bold text-muted" aria-hidden>
                    {ex.unit === "seconds" ? "Seconds" : "Reps"}
                  </span>
                  <Stepper
                    label={`${ex.unit === "seconds" ? "Seconds" : "Reps"} for set ${j + 1}`}
                    value={s.reps}
                    min={0}
                    max={ex.unit === "seconds" ? 600 : 100}
                    step={ex.unit === "seconds" ? 5 : 1}
                    disabled={s.completed}
                    onChange={(v) => set((x) => updateSetValues(x, idx, j, { reps: v }))}
                  />
                </div>
                {ex.loaded && (
                  <div>
                    <span className="mb-1 block text-xs font-bold text-muted" aria-hidden>
                      Weight ({units}){detail === "simple" ? " — optional" : ""}
                    </span>
                    <Stepper
                      label={`Weight in ${units} for set ${j + 1}`}
                      value={s.loadKg === null ? null : toDisplayLoad(s.loadKg, units)}
                      min={0}
                      max={units === "lb" ? 1000 : 500}
                      step={loadStep}
                      placeholder="—"
                      disabled={s.completed}
                      allowEmpty
                      onChange={(v) => set((x) => updateSetValues(x, idx, j, { loadKg: v === null ? null : fromDisplayLoad(v, units) }))}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        {paused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-surface/90 text-center backdrop-blur-sm">
            <Pause className="size-10 text-brand-600" aria-hidden />
            <p className="text-xl font-black">Paused</p>
            <p className="text-sm text-muted">Timers are paused. Take your time.</p>
            <Button onClick={() => set((s) => resumeSession(s, now()))}>
              <Play className="size-5" aria-hidden /> Resume
            </Button>
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" disabled={idx === 0} onClick={() => set((s) => goToExercise(s, idx - 1))}>
          <ChevronLeft className="size-5" aria-hidden /> Previous
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          disabled={idx === session.exercises.length - 1}
          onClick={() => set((s) => goToExercise(s, idx + 1))}
        >
          {current.sets.some((s) => !s.completed) ? "Skip to next" : "Next"} <ChevronRight className="size-5" aria-hidden />
        </Button>
      </div>
      <Button size="lg" variant={allDone ? "primary" : "outline"} onClick={() => setSheet("finish")}>
        {allDone ? "Finish workout" : "Finish early"}
      </Button>

      {/* Rest timer */}
      {session.rest && <div className="h-24" aria-hidden />}
      {session.rest && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 px-4 pb-3 sm:px-6" aria-live="polite">
          <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-3xl bg-ink p-3 pl-5 text-white shadow-lg">
            {restMs > 0 ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-aqua-300">{paused ? "Rest (paused)" : "Rest"}</p>
                  <p className="tabular text-3xl font-black" role="timer" aria-label={`Rest remaining ${clockText(restMs)}`}>
                    {clockText(restMs)}
                  </p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-aqua-300"
                      style={{ width: `${Math.min(100, (restMs / (session.rest.durationSec * 1000)) * 100)}%` }}
                    />
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => set((s) => extendRest(s, 30, now()))}>
                  +30s
                </Button>
                <Button size="sm" variant="aqua" onClick={() => set(skipRest)}>
                  Skip
                </Button>
              </>
            ) : (
              <>
                <p className="flex-1 font-extrabold">Rest done — ready for your next set.</p>
                <Button size="sm" variant="aqua" onClick={() => set(skipRest)}>
                  OK
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sheets */}
      <Sheet open={sheet === "leave"} onOpenChange={(o) => !o && setSheet(null)} title="Leave this workout?">
        <p className="text-muted">Your progress is saved on this device. You can come back to it from Today.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={() => router.push("/today")}>Leave for now</Button>
          <Button variant="secondary" onClick={() => setSheet("finish")}>
            Finish and save what I did
          </Button>
          <Button variant="ghost" className="text-coral-700" onClick={() => setSheet("discard")}>
            Discard this workout
          </Button>
        </div>
      </Sheet>

      <Sheet open={sheet === "discard"} onOpenChange={(o) => !o && setSheet(null)} title="Discard this workout?">
        <p className="text-muted">
          Nothing from this workout will be recorded{doneSets ? ` — including the ${doneSets} set${doneSets > 1 ? "s" : ""} you completed` : ""}. This can&apos;t be undone.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="danger"
            onClick={() => {
              update(discardSession);
              router.replace("/today");
            }}
          >
            Discard workout
          </Button>
          <Button variant="secondary" onClick={() => setSheet(null)}>
            Keep it
          </Button>
        </div>
      </Sheet>

      <Sheet open={sheet === "pain"} onOpenChange={(o) => !o && setSheet(null)} title="Let's stop and check in">
        <Notice tone="safety" title="Pain is a signal to stop, not to push through">
          Stop the exercise that hurts. If pain is sharp, severe or doesn&apos;t settle, stop exercising and speak to a qualified health
          professional. For chest pain, dizziness or trouble breathing, seek urgent medical help. Infit can&apos;t assess injuries.
        </Notice>
        <p className="mt-3 text-sm text-muted">Your Twin has paused any competition for today. Whatever you choose, nothing counts against you.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            onClick={() => {
              set((s) => {
                const nextIdx = s.exercises.findIndex((e, i) => i > idx && e.sets.some((x) => !x.completed));
                return { ...goToExercise(s, nextIdx === -1 ? idx : nextIdx), rest: null };
              });
              setSheet(null);
            }}
          >
            Skip this exercise
          </Button>
          <Button variant="secondary" onClick={() => setSheet(doneSets ? "finish" : "discard")}>
            End the workout here
          </Button>
          <Button variant="ghost" onClick={() => setSheet(null)}>
            Close
          </Button>
        </div>
      </Sheet>

      <Sheet open={sheet === "replace"} onOpenChange={(o) => !o && setSheet(null)} title={`Replace ${ex.name}`} description="Alternatives train the same movement and fit your equipment and limitations.">
        {alternatives.length ? (
          <div className="flex flex-col gap-2">
            {alternatives.map((alt) => (
              <button
                key={alt.id}
                type="button"
                className="rounded-2xl border-2 border-line p-3 text-left hover:border-brand-300"
                onClick={() => {
                  set((s) => replaceInSession(s, idx, alt.id));
                  setSheet(null);
                }}
              >
                <span className="block font-extrabold">{alt.name}</span>
                <span className="block text-sm text-muted">
                  {alt.summary} {alt.equipment.length ? `· ${alt.equipment.map((e) => EQUIPMENT_LABEL[e]).join(", ")}` : "· No equipment"}
                </span>
              </button>
            ))}
            <p className="mt-1 text-xs text-muted">This only changes today&apos;s workout. To change future plans, use Adjust today or ask your coach.</p>
          </div>
        ) : (
          <EmptyState title="No alternatives available">Nothing else fits your equipment and limitations for this movement. You can skip it instead.</EmptyState>
        )}
      </Sheet>

      <FinishSheet
        open={sheet === "finish"}
        onClose={() => setSheet(null)}
        done={doneSets}
        planned={plannedSets}
        onSave={finish}
        onDiscard={() => setSheet("discard")}
      />
    </div>
  );
}

function FinishSheet({
  open,
  onClose,
  done,
  planned,
  onSave,
  onDiscard,
}: {
  open: boolean;
  onClose: () => void;
  done: number;
  planned: number;
  onSave: (d: Difficulty | null, e: Energy | null) => void;
  onDiscard: () => void;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const partial = done < planned;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title={done === 0 ? "No sets completed yet" : partial ? "Finish early?" : "Workout complete! 🎉"}>
      {done === 0 ? (
        <>
          <p className="text-muted">Nothing will be saved because no sets are ticked off. Keep going, or discard this workout.</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={onClose}>Keep going</Button>
            <Button variant="ghost" className="text-coral-700" onClick={onDiscard}>
              Discard workout
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-muted">
            {partial
              ? `You completed ${done} of ${planned} sets. We'll save it as a partly completed session — every set counts.`
              : `All ${planned} sets done. Nice work!`}
          </p>
          <fieldset className="mt-4">
            <legend className="font-extrabold">How did it feel? <span className="font-normal text-muted">(optional)</span></legend>
            <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup">
              {(
                [
                  ["too-easy", "Too easy"],
                  ["about-right", "About right"],
                  ["too-hard", "Too hard"],
                ] as const
              ).map(([v, l]) => (
                <Chip key={v} role="radio" selected={difficulty === v} onClick={() => setDifficulty(difficulty === v ? null : v)}>
                  {l}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="font-extrabold">Energy today? <span className="font-normal text-muted">(optional)</span></legend>
            <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup">
              {(
                [
                  ["low", "Low"],
                  ["okay", "Okay"],
                  ["good", "Good"],
                ] as const
              ).map(([v, l]) => (
                <Chip key={v} role="radio" selected={energy === v} onClick={() => setEnergy(energy === v ? null : v)}>
                  {l}
                </Chip>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 flex flex-col gap-2">
            <Button size="lg" onClick={() => onSave(difficulty, energy)}>
              Save workout
            </Button>
            {partial && (
              <Button variant="secondary" onClick={onClose}>
                Keep going
              </Button>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
