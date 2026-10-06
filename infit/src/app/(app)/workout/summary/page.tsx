"use client";

import { Clock, Sparkles, Target } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TwinAvatar } from "@/components/TwinAvatar";
import { Badge, Card, EmptyState, LinkButton } from "@/components/ui";
import { weekSummary } from "@/domain/progress";
import { totalPoints } from "@/domain/rewards";
import { twinDisplayName } from "@/domain/state";
import { useAppStore } from "@/store/appStore";

export default function SummaryPage() {
  return (
    <Suspense>
      <Summary />
    </Suspense>
  );
}

const CONFETTI = ["#8B6CF6", "#3CCFC4", "#FFC94D", "#FF8A73", "#6FD39A", "#6AB6FF"];

function Summary() {
  const params = useSearchParams();
  const data = useAppStore((s) => s.data);
  const session = data.sessions.find((s) => s.id === params.get("id"));

  if (!session) {
    return (
      <div className="pt-6">
        <EmptyState title="Session not found">It may have been from a different device or data was reset.</EmptyState>
        <LinkButton href="/today" className="mt-4 w-full">
          Back to Today
        </LinkButton>
      </div>
    );
  }

  const earned = data.rewards.filter((r) => r.createdAt === session.endedAt);
  const week = weekSummary(data, session.date, session.date);
  const twin = twinDisplayName(data);
  const partial = session.status === "partial";
  const minutes = Math.max(1, Math.round(session.activeSeconds / 60));

  return (
    <div className="flex flex-col gap-5 pt-4">
      <div className="relative flex flex-col items-center text-center">
        <div className="pointer-events-none absolute inset-0 hidden motion-safe:block" aria-hidden>
          {CONFETTI.flatMap((c, i) =>
            [0, 1].map((k) => (
              <span
                key={`${i}-${k}`}
                className="absolute size-2.5 animate-pop rounded-sm"
                style={{
                  background: c,
                  left: `${8 + (((i * 2 + k) * 37) % 84)}%`,
                  top: `${(i * 13 + k * 29) % 60}%`,
                  animationDelay: `${(i + k) * 60}ms`,
                  transform: `rotate(${i * 30}deg)`,
                }}
              />
            )),
          )}
        </div>
        <div className="animate-pop">
          <TwinAvatar
            color={data.twin.color}
            expression={session.painReported ? "caring" : "excited"}
            accessories={data.twin.equipped}
            size={170}
            label={`${twin} celebrating`}
          />
        </div>
        <h1 className="mt-2 text-3xl font-black">
          {session.painReported ? "Saved. Take care of yourself." : partial ? "Every set counts!" : "Workout complete!"}
        </h1>
        <p className="mt-1 max-w-sm text-muted">
          {session.isReturn
            ? `Welcome back! ${twin} is so happy you're here. Coming back is the hardest part.`
            : partial
              ? `You did ${session.completedSets} of ${session.plannedSets} sets, and that's exactly what's recorded.`
              : `${twin} trained right alongside you.`}
        </p>
      </div>

      <Card>
        <ul className="grid grid-cols-3 gap-3 text-center">
          <li>
            <Target className="mx-auto size-5 text-aqua-600" aria-hidden />
            <p className="tabular text-2xl font-black">
              {session.completedSets}/{session.plannedSets}
            </p>
            <p className="text-xs font-bold text-muted">sets</p>
          </li>
          <li>
            <Clock className="mx-auto size-5 text-aqua-600" aria-hidden />
            <p className="tabular text-2xl font-black">{minutes}</p>
            <p className="text-xs font-bold text-muted">active min</p>
          </li>
          <li>
            <Sparkles className="mx-auto size-5 text-aqua-600" aria-hidden />
            <p className="tabular text-2xl font-black">
              {week.showedUp}/{week.plannedCount}
            </p>
            <p className="text-xs font-bold text-muted">this week</p>
          </li>
        </ul>
        {session.source !== "plan" && (
          <p className="mt-3 text-center text-sm text-muted">
            This was {session.source === "ramp" ? "an eased-in" : "an adjusted"} session (about {session.plannedMinutes} min
            planned). It counts as your session today; your progress stats use the work you actually did.
          </p>
        )}
      </Card>

      <Card aria-labelledby="points-title">
        <h2 id="points-title" className="font-extrabold">
          Twin points
        </h2>
        {earned.length ? (
          <ul className="mt-2 space-y-2">
            {earned.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <span>{r.label}</span>
                <Badge tone="sun">+{r.points}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted">
            No new points — you&apos;ve already earned today&apos;s session points. Points are just for fun and never decrease.
          </p>
        )}
        <p className="mt-3 text-sm text-muted">
          Total: {totalPoints(data)} points · cosmetic only, separate from your fitness progress.
        </p>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <LinkButton href="/today" size="lg" className="flex-1">
          Back to Today
        </LinkButton>
        <LinkButton href="/progress" size="lg" variant="secondary" className="flex-1">
          See progress
        </LinkButton>
      </div>
    </div>
  );
}
