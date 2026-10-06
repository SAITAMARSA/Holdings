"use client";

import clsx from "clsx";
import { Check, Lock, Pencil, Sparkles, Swords, HeartHandshake } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/toast";
import { TwinAvatar } from "@/components/TwinAvatar";
import { Badge, Button, Card, Chip, PageHeader, SectionTitle, Sheet } from "@/components/ui";
import { WeekStrip } from "@/components/WeekStrip";
import { formatShortDate } from "@/domain/dates";
import { weekSummary } from "@/domain/progress";
import { ACCESSORIES, POINT_RULES, totalPoints, unlockedAccessories } from "@/domain/rewards";
import type { TwinColor } from "@/domain/schema";
import { twinDisplayName } from "@/domain/state";
import { TWIN_COLORS, twinMood } from "@/domain/twin";
import { useToday } from "@/hooks/useClock";
import { useAppStore } from "@/store/appStore";

export default function TwinPage() {
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const today = useToday();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(data.twin.nickname);
  const [color, setColor] = useState<TwinColor>(data.twin.color);

  const twin = data.twin;
  const name = twinDisplayName(data);
  const mood = twinMood(data, today);
  const week = weekSummary(data, today, today);
  const points = totalPoints(data);
  const unlocked = unlockedAccessories(data);
  const nextUnlock = ACCESSORIES.find((a) => !unlocked.has(a.id));
  const paused = data.competitionPausedDates.includes(today);
  const competitive = twin.mode === "competitive";
  const recent = [...data.rewards].reverse().slice(0, 6);

  const toggleAccessory = (id: string) =>
    update((d) => ({
      ...d,
      twin: {
        ...d.twin,
        equipped: d.twin.equipped.includes(id) ? d.twin.equipped.filter((x) => x !== id) : [...d.twin.equipped, id],
      },
    }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={name} subtitle="Your Fitness Twin trains on the same plan as you — rest days included." />

      <Card className="flex flex-col items-center bg-gradient-to-b from-brand-50 to-surface text-center">
        <TwinAvatar
          color={twin.color}
          expression={mood.expression}
          accessories={twin.equipped}
          size={200}
          animate
          label={`${name}, looking ${mood.expression}`}
        />
        <p className="mt-2 max-w-sm rounded-3xl bg-surface px-4 py-3 font-bold shadow-card">{mood.message}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => {
            setNickname(twin.nickname);
            setColor(twin.color);
            setEditing(true);
          }}
        >
          <Pencil className="size-4" aria-hidden /> Customise
        </Button>
      </Card>

      {/* Companion mode */}
      <Card aria-labelledby="mode-title">
        <SectionTitle id="mode-title">Companion mode</SectionTitle>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Companion mode">
          <Chip
            role="radio"
            selected={!competitive}
            className="min-h-16 flex-col"
            onClick={() => update((d) => ({ ...d, twin: { ...d.twin, mode: "supportive" } }))}
          >
            <HeartHandshake className="size-5" aria-hidden /> Supportive
          </Chip>
          <Chip
            role="radio"
            selected={competitive}
            className="min-h-16 flex-col"
            onClick={() => update((d) => ({ ...d, twin: { ...d.twin, mode: "competitive" } }))}
          >
            <Swords className="size-5" aria-hidden /> Friendly race
          </Chip>
        </div>
        <p className="mt-3 text-sm text-muted">
          {competitive
            ? `${name} does each planned session on its day, and keeps pace with you today. It's a fair race: same plan, same adjustments, same rest days. No trash talk, ever.`
            : `${name} cheers you on and celebrates every session — full, short or partial.`}
        </p>
        {paused && (
          <p className="mt-2 rounded-2xl bg-coral-100 p-3 text-sm font-bold text-coral-700">
            Racing is paused today because you reported pain. Take care.
          </p>
        )}
      </Card>

      {/* Weekly challenge */}
      <Card aria-labelledby="challenge-title">
        <SectionTitle id="challenge-title">Weekly challenge</SectionTitle>
        <p className="font-bold">
          {week.plannedCount
            ? `Show up for your ${week.plannedCount} planned session${week.plannedCount > 1 ? "s" : ""} this week.`
            : "No sessions planned this week — enjoy the rest."}
        </p>
        <p className="mt-1 text-sm text-muted">
          Rest days never count against you. Shortened or adjusted sessions count when you finish the agreed version; partial
          sessions count as showing up and are recorded as partial.
        </p>
        <div className="mt-4">
          <WeekStrip days={week.days} today={today} />
        </div>
        <div className="mt-4 space-y-3">
          <ProgressRow label="You" value={week.showedUp} max={week.plannedCount} tone="brand" />
          {competitive && !paused && <ProgressRow label={name} value={week.twinCount} max={week.plannedCount} tone="aqua" />}
        </div>
        {week.goalMet && (
          <p className="mt-3 flex items-center gap-2 font-extrabold text-mint-700">
            <Check className="size-5" aria-hidden /> Challenge complete! +20 points
          </p>
        )}
      </Card>

      {/* Points */}
      <Card aria-labelledby="points-title">
        <SectionTitle
          id="points-title"
          action={
            <Badge tone="sun">
              <Sparkles className="size-3.5" aria-hidden /> {points} points
            </Badge>
          }
        >
          Twin points
        </SectionTitle>
        <p className="text-sm text-muted">
          Points are just for fun. They unlock accessories and are kept separate from your real fitness progress. They never go
          down, and each achievement can only be earned once.
        </p>
        <ul className="mt-3 divide-y divide-line">
          {POINT_RULES.map((r) => (
            <li key={r.label} className="flex items-start justify-between gap-3 py-2.5">
              <span>
                <span className="block font-bold">{r.label}</span>
                <span className="block text-sm text-muted">{r.detail}</span>
              </span>
              <Badge tone="sun">+{r.points}</Badge>
            </li>
          ))}
        </ul>
        {recent.length > 0 && (
          <>
            <h3 className="mt-4 font-extrabold">Recently earned</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex justify-between gap-3">
                  <span>
                    {r.label} <span className="text-muted">· {formatShortDate(r.date)}</span>
                  </span>
                  <span className="font-extrabold">+{r.points}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* Accessories */}
      <Card aria-labelledby="acc-title">
        <SectionTitle id="acc-title">Accessories</SectionTitle>
        <p className="mb-3 text-sm text-muted">
          {nextUnlock
            ? `${nextUnlock.unlockAt - points} more points to unlock ${nextUnlock.name}.`
            : "You've unlocked everything. Mix and match!"}
        </p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ACCESSORIES.map((a) => {
            const isUnlocked = unlocked.has(a.id);
            const equipped = twin.equipped.includes(a.id);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={!isUnlocked}
                  aria-pressed={isUnlocked ? equipped : undefined}
                  onClick={() => toggleAccessory(a.id)}
                  className={clsx(
                    "flex w-full flex-col items-center gap-1 rounded-3xl border-2 p-3 text-center",
                    equipped ? "border-brand-600 bg-brand-50" : "border-line bg-surface",
                    !isUnlocked && "cursor-not-allowed opacity-70",
                  )}
                >
                  <TwinAvatar color={twin.color} accessories={[a.id]} size={72} label="" />
                  <span className="text-sm font-extrabold">{a.name}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-muted">
                    {isUnlocked ? (
                      equipped ? (
                        <>
                          <Check className="size-3.5" aria-hidden /> Wearing
                        </>
                      ) : (
                        "Tap to wear"
                      )
                    ) : (
                      <>
                        <Lock className="size-3.5" aria-hidden /> {a.unlockAt} pts
                      </>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Sheet open={editing} onOpenChange={setEditing} title="Customise your Twin">
        <div className="flex justify-center">
          <TwinAvatar
            color={color}
            expression="happy"
            accessories={twin.equipped}
            size={130}
            label={`Preview in ${TWIN_COLORS[color].name}`}
          />
        </div>
        <fieldset className="mt-3">
          <legend className="mb-2 font-bold">Colour</legend>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Twin colour">
            {(Object.keys(TWIN_COLORS) as TwinColor[]).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                onClick={() => setColor(c)}
                className={clsx(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-xs font-bold",
                  color === c ? "border-brand-600 bg-brand-50" : "border-line",
                )}
              >
                <span className="size-6 rounded-full" style={{ background: TWIN_COLORS[c].body }} aria-hidden />
                {TWIN_COLORS[c].name}
              </button>
            ))}
          </div>
        </fieldset>
        <label htmlFor="twin-nick" className="mt-4 block font-bold">
          Nickname <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="twin-nick"
          maxLength={24}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-2xl border-2 border-line px-4 font-bold outline-none focus:border-brand-500"
        />
        <Button
          className="mt-5 w-full"
          onClick={() => {
            update((d) => ({ ...d, twin: { ...d.twin, color, nickname: nickname.trim().slice(0, 24) } }));
            setEditing(false);
            toast("Twin updated");
          }}
        >
          Save
        </Button>
      </Sheet>
    </div>
  );
}

function ProgressRow({ label, value, max, tone }: { label: string; value: number; max: number; tone: "brand" | "aqua" }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm font-extrabold">
        <span>{label}</span>
        <span className="tabular">
          {value}/{max}
        </span>
      </div>
      <div
        className="mt-1 h-3 overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-label={`${label}: ${value} of ${max} sessions`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={clsx("h-full rounded-full", tone === "brand" ? "bg-brand-600" : "bg-aqua-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
