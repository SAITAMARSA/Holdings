"use client";

import clsx from "clsx";
import { Award, CalendarCheck, Flag, History, LineChart, MessageSquareHeart, RefreshCcw, Sunrise } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/toast";
import { Badge, Button, Card, EmptyState, LinkButton, PageHeader, SectionTitle, Sheet } from "@/components/ui";
import { WeeklyChart, type WeekBar } from "@/components/WeeklyChart";
import { REASON_LABEL } from "@/domain/adjust";
import { addDays, formatShortDate, startOfWeek } from "@/domain/dates";
import {
  consistencyStats,
  exerciseHistories,
  feedbackSummary,
  latestBaseline,
  weeklyReview,
  weekSummary,
} from "@/domain/progress";
import type { AppData } from "@/domain/schema";
import { useToday } from "@/hooks/useClock";
import { useAppStore } from "@/store/appStore";

function achievements(data: AppData, today: string) {
  const stats = consistencyStats(data, today);
  const fullWeek = data.rewards.some((r) => r.kind === "weekly-goal");
  return [
    { id: "first", label: "First session", earned: stats.totalSessions >= 1, icon: Flag },
    { id: "five", label: "5 sessions", earned: stats.totalSessions >= 5, icon: CalendarCheck },
    { id: "week", label: "First full week", earned: fullWeek, icon: Award },
    { id: "comeback", label: "Came back after a break", earned: stats.comebacks >= 1, icon: Sunrise },
    { id: "ten", label: "10 sessions", earned: stats.totalSessions >= 10, icon: Award },
    { id: "four-weeks", label: "Active in 4 different weeks", earned: stats.activeWeeks >= 4, icon: CalendarCheck },
  ];
}

export default function ProgressPage() {
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const today = useToday();
  const [confirmBaseline, setConfirmBaseline] = useState(false);

  const review = weeklyReview(data, today, today);
  const stats = consistencyStats(data, today);
  const histories = exerciseHistories(data);
  const baseline = latestBaseline(data);
  const fb = feedbackSummary(data.sessions.slice(-10));
  const units = data.profile?.units ?? "kg";
  const weeks: WeekBar[] = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(startOfWeek(today), -7 * (7 - i));
    const w = weekSummary(data, start, today);
    return { start, showedUp: w.showedUp, partial: w.partialCount, planned: w.plannedCount, current: i === 7 };
  });
  const firstWeek = data.plan ? startOfWeek(data.planHistory[0]?.effectiveFrom ?? data.plan.effectiveFrom) : today;
  const visibleWeeks = weeks.filter((w) => w.start >= firstWeek);
  const sessions = [...data.sessions].reverse();
  const planVersions = [...data.planHistory, ...(data.plan ? [data.plan] : [])].reverse();
  const revisions = [...data.revisions].reverse();
  const fmtLoad = (kg: number) => (units === "lb" ? Math.round(kg * 2.20462) : kg);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Progress" subtitle="Showing up, getting stronger and how it felt — kept separate so each one is honest." />

      {/* Weekly review */}
      <Card className="border-2 border-brand-200 bg-brand-50" aria-labelledby="review-title">
        <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">This week&apos;s review</p>
        <h2 id="review-title" className="mt-1 text-xl font-black">
          {review.headline}
        </h2>
        {review.points.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {review.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <div className="mt-4 rounded-2xl bg-surface p-4">
          <p className="text-sm font-extrabold text-brand-700">Proposed next step</p>
          <p className="mt-1">{review.nextStep}</p>
        </div>
      </Card>

      {/* Consistency */}
      <Card aria-labelledby="consistency-title">
        <SectionTitle id="consistency-title">Consistency</SectionTitle>
        {stats.totalSessions === 0 ? (
          <EmptyState icon={<CalendarCheck className="size-6" />} title="No sessions yet">
            Your first workout starts your history. Rest days never count against you.
          </EmptyState>
        ) : (
          <>
            <dl className="grid grid-cols-3 gap-3">
              <Stat label="Sessions" value={stats.totalSessions} hint={stats.partialSessions ? `${stats.partialSessions} partly` : undefined} />
              <Stat label="Active weeks" value={stats.activeWeeks} hint={stats.currentActiveWeekRun > 1 ? `${stats.currentActiveWeekRun} in a row` : undefined} />
              <Stat label="Comebacks" value={stats.comebacks} />
            </dl>
            {visibleWeeks.length >= 2 ? (
              <div className="mt-5">
                <WeeklyChart weeks={visibleWeeks} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">A week-by-week chart appears once you have more than one week of history.</p>
            )}
          </>
        )}
      </Card>

      {/* Performance */}
      <Card aria-labelledby="performance-title">
        <SectionTitle id="performance-title">Performance</SectionTitle>
        <p className="-mt-1 mb-3 text-sm text-muted">
          Each exercise is only compared with itself. Shorter or easier sessions are never counted as improvement.
          {baseline && ` Comparisons start from your fresh baseline on ${formatShortDate(baseline)}.`}
        </p>
        {histories.length === 0 ? (
          <EmptyState icon={<LineChart className="size-6" />} title="Nothing to compare yet">
            Complete the same exercise twice and you&apos;ll see how it&apos;s going here.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {histories.slice(0, 12).map((h) => (
              <li key={h.exerciseId} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-extrabold">{h.name}</p>
                  <Badge tone={h.trend.kind === "up" ? "mint" : "neutral"}>
                    {h.trend.kind === "up" ? "Improving" : h.trend.kind === "insufficient" ? "1 session" : h.trend.kind === "down" ? "Lower" : "Steady"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted">{h.trend.text}</p>
                {h.points.length > 0 && (
                  <details className="mt-1 text-sm">
                    <summary className="cursor-pointer font-bold text-brand-700">History ({h.points.length + h.earlier.length})</summary>
                    <ul className="tabular mt-1 space-y-0.5">
                      {[...h.points].reverse().map((p) => (
                        <li key={p.sessionId}>
                          {formatShortDate(p.date)}: {p.loadKg !== null ? `${fmtLoad(p.loadKg)} ${units} × ` : ""}
                          {p.reps}
                          {p.unit === "seconds" ? "s" : " reps"}
                        </li>
                      ))}
                      {h.earlier.length > 0 && <li className="text-muted">+ {h.earlier.length} before your baseline (kept)</li>}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
        {stats.totalSessions > 0 && (
          <Button size="sm" variant="secondary" className="mt-4" onClick={() => setConfirmBaseline(true)}>
            <RefreshCcw className="size-4" aria-hidden /> Start a fresh baseline
          </Button>
        )}
      </Card>

      {/* Personal feedback */}
      <Card aria-labelledby="feedback-title">
        <SectionTitle id="feedback-title">How it felt</SectionTitle>
        {fb.rated === 0 && fb.energyRated === 0 ? (
          <EmptyState icon={<MessageSquareHeart className="size-6" />} title="No feedback yet">
            After each workout you can tell us how hard it felt. It&apos;s optional, and it helps your coach suggest the right next step.
          </EmptyState>
        ) : (
          <>
            <p className="mb-2 text-sm text-muted">Your last {Math.min(10, data.sessions.length)} sessions, where you told us.</p>
            <FeedbackRow label="Too easy" value={fb.tooEasy} total={fb.rated} />
            <FeedbackRow label="About right" value={fb.aboutRight} total={fb.rated} />
            <FeedbackRow label="Too hard" value={fb.tooHard} total={fb.rated} />
            {fb.energyRated > 0 && (
              <p className="mt-3 text-sm">
                Energy: {fb.energyGood} good · {fb.energyOkay} okay · {fb.energyLow} low
              </p>
            )}
            {fb.painReports > 0 && <p className="mt-2 text-sm font-bold text-coral-700">Pain reported in {fb.painReports} session(s).</p>}
          </>
        )}
      </Card>

      {/* Achievements */}
      <Card aria-labelledby="ach-title">
        <SectionTitle id="ach-title">Milestones</SectionTitle>
        <p className="-mt-1 mb-3 text-sm text-muted">Milestones are permanent — breaks never take them away.</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {achievements(data, today).map(({ id, label, earned, icon: Icon }) => (
            <li
              key={id}
              className={clsx(
                "flex items-center gap-2 rounded-2xl border-2 p-3 text-sm font-bold",
                earned ? "border-sun-300 bg-sun-100 text-sun-800" : "border-dashed border-line text-muted",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span>
                {label}
                <span className="sr-only">{earned ? " — earned" : " — not yet"}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* History */}
      <Card aria-labelledby="sessions-title">
        <SectionTitle id="sessions-title">Session history</SectionTitle>
        {sessions.length === 0 ? (
          <EmptyState title="No sessions recorded">
            <LinkButton href="/today" size="sm" className="mt-2">
              Go to Today
            </LinkButton>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {sessions.slice(0, 20).map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-3 py-2.5">
                <span>
                  <span className="block font-bold">{s.name}</span>
                  <span className="block text-sm text-muted">
                    {formatShortDate(s.date)} · {s.completedSets}/{s.plannedSets} sets · {Math.max(1, Math.round(s.activeSeconds / 60))} min
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap justify-end gap-1">
                  <Badge tone={s.status === "completed" ? "mint" : "aqua"}>{s.status === "completed" ? "Completed" : "Partly"}</Badge>
                  {s.source !== "plan" && <Badge tone="neutral">{s.source === "ramp" ? "Eased" : "Adjusted"}</Badge>}
                  {s.isReturn && <Badge tone="sun">Comeback</Badge>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card aria-labelledby="plan-history">
        <SectionTitle id="plan-history">
          <span className="flex items-center gap-2">
            <History className="size-5" aria-hidden /> Plan changes
          </span>
        </SectionTitle>
        {revisions.length === 0 && planVersions.length <= 1 ? (
          <p className="text-sm text-muted">No changes yet. Every adjustment you accept is listed here, with the original kept.</p>
        ) : (
          <ul className="divide-y divide-line">
            {revisions.map((r) => (
              <li key={r.id} className="py-2.5">
                <p className="font-bold">{r.title}</p>
                <p className="text-sm text-muted">
                  {formatShortDate(r.date)} · {REASON_LABEL[r.reason]} · {r.scope === "today" ? "just that day" : "lasting change"}
                  {r.beforeMinutes !== null && r.afterMinutes !== null && ` · ${r.beforeMinutes} → ${r.afterMinutes} min`}
                </p>
              </li>
            ))}
            {planVersions.map((p) => (
              <li key={p.id} className="py-2.5">
                <p className="font-bold">
                  Plan version {p.version}
                  {p.id === data.plan?.id && <Badge tone="brand" className="ml-2">Current</Badge>}
                </p>
                <p className="text-sm text-muted">
                  From {formatShortDate(p.effectiveFrom)} · {p.reason}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Sheet open={confirmBaseline} onOpenChange={setConfirmBaseline} title="Start a fresh baseline?">
        <p className="text-muted">
          Useful after a break or a big change. Performance comparisons will start from today. Your history, milestones and points are all
          kept.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            onClick={() => {
              update((d) => ({ ...d, baselines: [...d.baselines, { date: today, reason: "Chosen in Progress" }] }));
              setConfirmBaseline(false);
              toast("Fresh baseline started");
            }}
          >
            Start fresh baseline
          </Button>
          <Button variant="secondary" onClick={() => setConfirmBaseline(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-sunken p-3 text-center">
      <dt className="text-xs font-bold text-muted">{label}</dt>
      <dd className="text-2xl font-black">{value}</dd>
      {hint && <dd className="text-xs text-muted">{hint}</dd>}
    </div>
  );
}

function FeedbackRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="mb-2 flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 font-bold">{label}</span>
      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
        <span className="block h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular w-6 text-right">{value}</span>
    </div>
  );
}
