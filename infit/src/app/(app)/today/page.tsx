"use client";

import { ChefHat, Clock, Dumbbell, History, Moon, Play, Settings, SlidersHorizontal, Target, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckInCard } from "@/components/CheckInCard";
import { targetText } from "@/components/format";
import { toast } from "@/components/toast";
import { TwinAvatar } from "@/components/TwinAvatar";
import { Badge, Button, Card, LinkButton, SectionTitle, Sheet } from "@/components/ui";
import { WeekLegend, WeekStrip } from "@/components/WeekStrip";
import { revertDay } from "@/domain/adjust";
import { formatLongDate, partOfDay, relativeDayLabel } from "@/domain/dates";
import { EQUIPMENT_LABEL, exerciseOrStub } from "@/domain/exercises";
import { formatMoney, mealOfTheDay } from "@/domain/meals";
import { nextPlannedDate, plannedSessionFor, totalSets } from "@/domain/plan";
import { weekSummary } from "@/domain/progress";
import { startSession } from "@/domain/session";
import { twinDisplayName } from "@/domain/state";
import { twinMood } from "@/domain/twin";
import { useToday } from "@/hooks/useClock";
import { now, useAppStore } from "@/store/appStore";

export default function TodayPage() {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const today = useToday();
  const [showChanges, setShowChanges] = useState(false);
  const [showExercises, setShowExercises] = useState(false);

  const profile = data.profile!;
  const planned = plannedSessionFor(data, today);
  const week = weekSummary(data, today, today);
  const todayStatus = week.days.find((d) => d.date === today)!;
  const mood = twinMood(data, today);
  const twin = twinDisplayName(data);
  const active = data.activeSession;
  const override = data.overrides.find((o) => o.date === today);
  const revision = override ? data.revisions.find((r) => r.id === override.revisionId) : undefined;
  const meal = mealOfTheDay(data.meals.prefs, today);
  const next = !planned ? nextPlannedDate(data, today, 7) : null;
  const detail = profile.displayDetail;
  const competitive = data.twin.mode === "competitive" && !data.competitionPausedDates.includes(today);

  const start = () => {
    if (!planned) return;
    update((d) => ({ ...d, activeSession: startSession(d, planned, now()) }));
    router.push("/workout");
  };

  const equipment = planned
    ? [...new Set(planned.exercises.flatMap((e) => exerciseOrStub(e.exerciseId).equipment))]
    : [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-muted">{formatLongDate(today)}</p>
          <h1 className="text-3xl font-black tracking-tight">
            Good {partOfDay(new Date())}, {profile.name}
          </h1>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-ink hover:bg-sunken lg:hidden"
        >
          <Settings className="size-6" aria-hidden />
        </Link>
      </header>

      {/* Twin message */}
      <Link
        href="/twin"
        className="flex items-center gap-3 rounded-3xl bg-brand-50 p-3 pr-4 transition-colors hover:bg-brand-100"
        aria-label={`${twin} says: ${mood.message} Open Twin.`}
      >
        <TwinAvatar color={data.twin.color} expression={mood.expression} accessories={data.twin.equipped} size={64} label="" animate />
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">{twin}</p>
          <p className="font-bold leading-snug">{mood.message}</p>
        </div>
      </Link>

      {active && active.date !== today && (
        <Card className="border-2 border-sun-300 bg-sun-100">
          <p className="font-extrabold text-sun-800">You have an unfinished workout from {formatLongDate(active.date)}.</p>
          <div className="mt-3 flex gap-2">
            <LinkButton href="/workout" size="sm">
              Open it
            </LinkButton>
          </div>
        </Card>
      )}

      <CheckInCard today={today} />

      {/* Today's plan */}
      {planned ? (
        <Card className="relative overflow-hidden p-0" aria-labelledby="today-title">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-5 pb-5 pt-4 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold uppercase tracking-wide text-brand-100">Today&apos;s workout</span>
              {planned.source === "adjusted" && <Badge tone="aqua">Adjusted today</Badge>}
              {planned.source === "ramp" && <Badge tone="aqua">Easing back in</Badge>}
              {planned.location === "home" && <Badge tone="sun">At home</Badge>}
            </div>
            <h2 id="today-title" className="mt-1 text-2xl font-black">
              {planned.name}
            </h2>
            <p className="mt-1 text-brand-100">{planned.purpose}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
              <span className="flex items-center gap-1">
                <Clock className="size-4" aria-hidden /> About {planned.estMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="size-4" aria-hidden /> {planned.exercises.length} exercises
                {detail === "detailed" && ` · ${totalSets(planned)} sets`}
              </span>
            </div>
          </div>

          <div className="p-5">
            {todayStatus.state === "completed" ? (
              <div className="flex flex-col gap-3">
                <p className="text-lg font-extrabold">Done for today — nice work! 🎉</p>
                <p className="text-muted">
                  {todayStatus.session!.completedSets} sets recorded. Rest up — recovery is where progress happens.
                </p>
                <LinkButton href="/progress" variant="secondary">
                  See your progress
                </LinkButton>
              </div>
            ) : active && active.date === today ? (
              <div className="flex flex-col gap-3">
                <p className="font-extrabold">Your workout is in progress.</p>
                <LinkButton href="/workout" size="lg">
                  <Play className="size-5" aria-hidden /> Resume workout
                </LinkButton>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {todayStatus.state === "partial" && (
                  <p className="rounded-2xl bg-aqua-50 p-3 text-sm font-bold text-aqua-800">
                    You did {todayStatus.session!.completedSets} of {todayStatus.session!.plannedSets} sets earlier — that&apos;s
                    saved. You can start again if you have time.
                  </p>
                )}
                <Button size="lg" onClick={start}>
                  <Play className="size-5" aria-hidden /> {todayStatus.state === "partial" ? "Start again" : "Start workout"}
                </Button>
                <LinkButton href="/adjust" size="lg" variant="secondary">
                  <SlidersHorizontal className="size-5" aria-hidden /> Adjust today
                </LinkButton>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="text-sm font-extrabold text-brand-700 underline-offset-4 hover:underline"
                aria-expanded={showExercises}
                aria-controls="today-exercises"
                onClick={() => setShowExercises((v) => !v)}
              >
                {showExercises ? "Hide exercises" : "Show exercises"}
              </button>
              {revision && (
                <>
                  <span className="text-muted" aria-hidden>
                    ·
                  </span>
                  <button
                    type="button"
                    className="text-sm font-extrabold text-brand-700 underline-offset-4 hover:underline"
                    onClick={() => setShowChanges(true)}
                  >
                    What changed today?
                  </button>
                </>
              )}
            </div>
            {showExercises && (
              <ul id="today-exercises" className="mt-3 divide-y divide-line">
                {planned.exercises.map((pe) => {
                  const ex = exerciseOrStub(pe.exerciseId);
                  return (
                    <li key={pe.slotId} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="font-bold">{ex.name}</span>
                      <span className="shrink-0 text-sm text-muted">{targetText(pe.sets, pe.target, ex.unit, detail)}</span>
                    </li>
                  );
                })}
                <li className="pt-2.5 text-sm text-muted">
                  Equipment: {equipment.length ? equipment.map((e) => EQUIPMENT_LABEL[e]).join(", ") : "none needed"}
                </li>
              </ul>
            )}
          </div>
        </Card>
      ) : (
        <Card aria-labelledby="rest-title">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sunken text-brand-700" aria-hidden>
              <Moon className="size-6" />
            </span>
            <div>
              <h2 id="rest-title" className="text-xl font-black">
                {todayStatus.state === "extra" ? "Bonus session done!" : "Rest day"}
              </h2>
              <p className="mt-1 text-muted">
                {override
                  ? "You changed today to a rest day. Your Twin is resting too, and nothing counts as missed."
                  : "Rest is part of the plan — your body adapts between sessions. A walk or a stretch is a nice extra."}
              </p>
              {next && (
                <p className="mt-2 text-sm font-bold">
                  Next workout: {relativeDayLabel(next, today)} — {plannedSessionFor(data, next)?.name}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <LinkButton href="/adjust?reason=schedule-changed" variant="secondary" className="flex-1">
              <SlidersHorizontal className="size-5" aria-hidden /> Train today instead
            </LinkButton>
            {revision && (
              <Button variant="ghost" onClick={() => setShowChanges(true)}>
                What changed?
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Week */}
      <Card aria-labelledby="week-title">
        <SectionTitle id="week-title" action={<Link href="/progress" className="text-sm font-extrabold text-brand-700">Progress</Link>}>
          This week
        </SectionTitle>
        <WeekStrip days={week.days} today={today} />
        <WeekLegend />
        <p className="mt-4 flex items-center gap-2 font-bold">
          <Target className="size-5 text-aqua-600" aria-hidden />
          {week.plannedCount === 0
            ? "No training days planned this week."
            : `${week.showedUp} of ${week.plannedCount} planned sessions${week.partialCount ? ` (${week.partialCount} partly)` : ""}`}
        </p>
        {competitive && week.plannedCount > 0 && (
          <p className="mt-1 text-sm text-muted">
            {twin} is on {week.twinCount} — they follow the same plan, rest days included.
          </p>
        )}
      </Card>

      {/* Meal */}
      <Card aria-labelledby="meal-title">
        <SectionTitle
          id="meal-title"
          action={
            <Link href="/meals" className="text-sm font-extrabold text-brand-700">
              Meals
            </Link>
          }
        >
          A simple meal idea
        </SectionTitle>
        {meal ? (
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sun-100 text-sun-800" aria-hidden>
              <ChefHat className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-extrabold">{meal.meal.name}</p>
              <p className="text-sm text-muted">
                {meal.meal.minutes} min
                {data.meals.prefs && ` · est. ${formatMoney(meal.costPerServingUsd, data.meals.prefs.currency)} per serving`}
                {meal.substitutions.length > 0 && ` · ${meal.substitutions.length} swap${meal.substitutions.length > 1 ? "s" : ""} for your diet`}
              </p>
              {!data.meals.prefs && (
                <p className="mt-2 text-sm">
                  Not yet tailored to allergies, diet or budget.{" "}
                  <Link href="/meals/preferences" className="font-extrabold text-brand-700 underline">
                    Set preferences
                  </Link>
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted">
            No curated meals match your preferences yet.{" "}
            <Link href="/meals/preferences" className="font-extrabold text-brand-700 underline">
              Review preferences
            </Link>
          </p>
        )}
      </Card>

      <Sheet open={showChanges} onOpenChange={setShowChanges} title="What changed today">
        {revision && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-extrabold">{revision.title}</p>
              <p className="text-sm text-muted">
                {revision.scope === "today" ? "Just for today." : "Also applied to future sessions."}{" "}
                {revision.beforeMinutes !== null && revision.afterMinutes !== null &&
                  `About ${revision.beforeMinutes} → ${revision.afterMinutes} min.`}
              </p>
            </div>
            <ul className="list-disc space-y-1 pl-5">
              {revision.changes.map((c, i) => (
                <li key={i}>{c.text}</li>
              ))}
            </ul>
            <p className="text-sm">
              <span className="font-extrabold">Why: </span>
              {revision.why}
            </p>
            <p className="text-sm">
              <span className="font-extrabold">Preserved: </span>
              {revision.preserved}
            </p>
            {revision.scope === "today" && !(active && active.date === today) && !todayStatus.session && (
              <Button
                variant="secondary"
                onClick={() => {
                  update((d) => revertDay(d, today));
                  setShowChanges(false);
                  toast("Back to your original plan for today");
                }}
              >
                <Undo2 className="size-5" aria-hidden /> Undo — use the original plan
              </Button>
            )}
            <LinkButton href="/progress#plan-history" variant="ghost" onClick={() => setShowChanges(false)}>
              <History className="size-5" aria-hidden /> See all plan changes
            </LinkButton>
          </div>
        )}
      </Sheet>
    </div>
  );
}
