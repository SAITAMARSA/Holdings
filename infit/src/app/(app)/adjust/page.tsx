"use client";

import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  Clock,
  Dumbbell,
  Home,
  Repeat2,
  ShieldAlert,
  Sunrise,
  TrendingDown,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type ReactNode } from "react";
import { targetText } from "@/components/format";
import { toast } from "@/components/toast";
import { Badge, Button, Card, Chip, LinkButton, Notice, OptionCard, PageHeader } from "@/components/ui";
import {
  ADJUST_REASONS,
  applyProposal,
  proposeAdjustment,
  REASON_LABEL,
  replacementOptions,
  type AdjustInput,
  type Proposal,
  type Scope,
} from "@/domain/adjust";
import { addDays, formatLongDate, relativeDayLabel, WEEKDAY_SHORT } from "@/domain/dates";
import { ALL_EQUIPMENT, EQUIPMENT_LABEL, exerciseOrStub } from "@/domain/exercises";
import { equipmentProfileFor, plannedSessionFor } from "@/domain/plan";
import { AdjustReason, type Equipment, type PlannedSession } from "@/domain/schema";
import { useToday } from "@/hooks/useClock";
import { now, useAppStore } from "@/store/appStore";

const ICONS: Record<AdjustReason, ReactNode> = {
  "less-time": <Clock className="size-5" />,
  "equipment-unavailable": <Dumbbell className="size-5" />,
  "different-gym": <Building2 className="size-5" />,
  "at-home": <Home className="size-5" />,
  "too-difficult": <TrendingDown className="size-5" />,
  "schedule-changed": <CalendarClock className="size-5" />,
  returning: <Sunrise className="size-5" />,
  "swap-exercise": <Repeat2 className="size-5" />,
};

export default function AdjustPage() {
  return (
    <Suspense>
      <AdjustFlow />
    </Suspense>
  );
}

function AdjustFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const today = useToday();
  const initial = AdjustReason.safeParse(params.get("reason"));
  const [reason, setReason] = useState<AdjustReason | null>(initial.success ? initial.data : null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope | null>(null);
  const [rememberHome, setRememberHome] = useState(true);
  const [freshBaseline, setFreshBaseline] = useState(false);

  const session = plannedSessionFor(data, today);
  const detail = data.profile?.displayDetail ?? "simple";

  const submit = (input: AdjustInput) => {
    const r = proposeAdjustment({ data, date: today }, input);
    if (!r.ok) {
      setMessage(r.message);
      setProposal(null);
      return;
    }
    setMessage(null);
    setProposal(r.proposal);
    setScope(r.proposal.scopes.length === 1 ? r.proposal.scopes[0].scope : null);
  };

  const cancel = () => {
    router.push("/today");
  };

  const accept = () => {
    if (!proposal || !scope) return;
    update((d) => applyProposal(d, proposal, scope, now(), { rememberHomeEquipment: rememberHome, freshBaseline }));
    toast(scope === "future" ? "Plan updated" : "Today's plan updated");
    router.push("/today");
  };

  const backFromDetails = () => {
    setReason(null);
    setMessage(null);
  };

  // ---------------------------------------------------------------- preview
  if (proposal) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          back={
            <button type="button" onClick={() => setProposal(null)} className="flex min-h-11 items-center gap-1 font-extrabold text-brand-700">
              <ArrowLeft className="size-5" aria-hidden /> Back
            </button>
          }
          title="Here's the proposed change"
          subtitle="Nothing changes until you accept."
        />
        {proposal.safety && (
          <Notice tone="safety" title="Your safety comes first">
            <span className="flex gap-2">
              <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
              {proposal.safety}
            </span>
          </Notice>
        )}
        <Card aria-labelledby="proposal-title">
          <h2 id="proposal-title" className="text-xl font-black">
            {proposal.title}
          </h2>
          <DurationCompare before={proposal.before} after={proposal.after} />

          <h3 className="mt-5 font-extrabold">What changes</h3>
          <ul className="mt-2 space-y-2">
            {proposal.changes.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <Badge tone={c.kind === "removed" || c.kind === "rest" ? "neutral" : c.kind === "kept" ? "mint" : "brand"} className="mt-0.5 shrink-0 capitalize">
                  {c.kind.replace("-", " ")}
                </Badge>
                <span>{c.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-5 font-extrabold">Why</h3>
          <p className="mt-1 text-muted">{proposal.why}</p>

          <h3 className="mt-5 font-extrabold">What&apos;s preserved</h3>
          <p className="mt-1 text-muted">{proposal.preserved}</p>

          {proposal.after && proposal.after.exercises.length > 0 && (
            <details className="mt-5 rounded-2xl bg-sunken p-3">
              <summary className="cursor-pointer font-extrabold">Revised session</summary>
              <ul className="mt-2 divide-y divide-line">
                {proposal.after.exercises.map((pe) => {
                  const ex = exerciseOrStub(pe.exerciseId);
                  return (
                    <li key={pe.slotId} className="flex justify-between gap-3 py-2 text-sm">
                      <span className="font-bold">{ex.name}</span>
                      <span className="text-muted">{targetText(pe.sets, pe.target, ex.unit, detail)}</span>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </Card>

        {proposal.scopes.length > 1 && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-lg font-extrabold">Is this just for today?</legend>
            {proposal.scopes.map((s) => (
              <label
                key={s.scope}
                className={clsx(
                  "flex cursor-pointer items-start gap-3 rounded-3xl border-2 p-4",
                  scope === s.scope ? "border-brand-600 bg-brand-50" : "border-line bg-surface",
                )}
              >
                <input
                  type="radio"
                  name="scope"
                  value={s.scope}
                  checked={scope === s.scope}
                  onChange={() => setScope(s.scope)}
                  className="mt-1 size-5 accent-brand-600"
                />
                <span>
                  <span className="block font-extrabold">{s.label}</span>
                  <span className="block text-sm text-muted">{s.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {proposal.options?.rememberHomeEquipment && (
          <label className="flex items-start gap-3 rounded-2xl bg-surface p-4">
            <input
              type="checkbox"
              checked={rememberHome}
              onChange={(e) => setRememberHome(e.target.checked)}
              className="mt-1 size-5 accent-brand-600"
            />
            <span>
              <span className="block font-extrabold">Remember this as my home equipment</span>
              <span className="block text-sm text-muted">So you won&apos;t need to pick it again next time.</span>
            </span>
          </label>
        )}
        {proposal.options?.offerFreshBaseline && (
          <label className="flex items-start gap-3 rounded-2xl bg-surface p-4">
            <input
              type="checkbox"
              checked={freshBaseline}
              onChange={(e) => setFreshBaseline(e.target.checked)}
              className="mt-1 size-5 accent-brand-600"
            />
            <span>
              <span className="block font-extrabold">Start a fresh progress baseline</span>
              <span className="block text-sm text-muted">
                Progress comparisons start again from today. Your history and achievements are kept.
              </span>
            </span>
          </label>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="flex-1" onClick={accept} disabled={!scope}>
            {scope ? "Accept change" : "Choose an option above"}
          </Button>
          <Button size="lg" variant="secondary" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- reason list
  if (!reason) {
    const restDay = !session;
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          back={
            <button type="button" onClick={cancel} className="flex min-h-11 items-center gap-1 font-extrabold text-brand-700">
              <ArrowLeft className="size-5" aria-hidden /> Today
            </button>
          }
          title="Adjust today"
          subtitle={
            session
              ? `${session.name} · about ${session.estMinutes} min. What's changed?`
              : "Today is a rest day. What's changed?"
          }
        />
        {data.activeSession?.date === today && (
          <Notice tone="warning" title="Workout in progress">
            Finish or discard your current workout before adjusting today. In a workout you can replace exercises or report pain directly.
          </Notice>
        )}
        <div className="flex flex-col gap-3">
          {[...ADJUST_REASONS, "swap-exercise" as const].map((r) => {
            const needsSession = r !== "schedule-changed";
            return (
              <OptionCard
                key={r}
                icon={ICONS[r]}
                title={REASON_LABEL[r]}
                description={restDay && needsSession ? "Only available on training days" : undefined}
                disabled={(restDay && needsSession) || data.activeSession?.date === today}
                className="disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setReason(r)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- details
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        back={
          <button type="button" onClick={backFromDetails} className="flex min-h-11 items-center gap-1 font-extrabold text-brand-700">
            <ArrowLeft className="size-5" aria-hidden /> All reasons
          </button>
        }
        title={REASON_LABEL[reason]}
      />
      {message && (
        <Notice tone="warning" title="No change needed">
          {message}
        </Notice>
      )}
      <Details reason={reason} session={session} today={today} onSubmit={submit} />
      <LinkButton href="/today" variant="ghost">
        Cancel
      </LinkButton>
    </div>
  );
}

function DurationCompare({ before, after }: { before: PlannedSession | null; after: PlannedSession | null }) {
  const fmt = (s: PlannedSession | null) => (s ? `${s.estMinutes} min` : "Rest");
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-brand-50 p-3 font-extrabold">
      <span>
        <span className="block text-xs uppercase tracking-wide text-muted">Before</span>
        {fmt(before)}
      </span>
      <ArrowRight className="size-5 text-brand-600" aria-label="becomes" />
      <span>
        <span className="block text-xs uppercase tracking-wide text-muted">After</span>
        {fmt(after)}
      </span>
    </div>
  );
}

function Question({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-black">{children}</h2>
      {hint && <p className="mt-1 text-muted">{hint}</p>}
    </div>
  );
}

function EquipmentPicker({
  options,
  value,
  onChange,
  label,
}: {
  options: Equipment[];
  value: Equipment[];
  onChange: (v: Equipment[]) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((e) => (
        <Chip
          key={e}
          selected={value.includes(e)}
          onClick={() => onChange(value.includes(e) ? value.filter((x) => x !== e) : [...value, e])}
        >
          {EQUIPMENT_LABEL[e]}
        </Chip>
      ))}
    </div>
  );
}

function Details({
  reason,
  session,
  today,
  onSubmit,
}: {
  reason: AdjustReason;
  session: PlannedSession | null;
  today: string;
  onSubmit: (input: AdjustInput) => void;
}) {
  const data = useAppStore((s) => s.data);
  const usedEquipment = useMemo(
    () => [...new Set((session?.exercises ?? []).flatMap((e) => exerciseOrStub(e.exerciseId).equipment))],
    [session],
  );
  const [minutes, setMinutes] = useState<number | null>(null);
  const [missing, setMissing] = useState<Equipment[]>([]);
  const [gymEq, setGymEq] = useState<Equipment[]>(equipmentProfileFor(data, "gym").equipment);
  const [homeEq, setHomeEq] = useState<Equipment[]>(equipmentProfileFor(data, "home").equipment);
  const [hardKind, setHardKind] = useState<"overall" | "exercise" | "pain" | null>(null);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [days, setDays] = useState<number[]>(data.profile?.trainingDays ?? []);
  const [scheduleAction, setScheduleAction] = useState<"rest-today" | "move" | "train-today" | "change-days" | null>(null);

  if (reason === "less-time" && session) {
    const options = [10, 15, 20, 30, 45].filter((m) => m < session.estMinutes);
    return (
      <>
        <Question hint={`Today's session takes about ${session.estMinutes} minutes.`}>How many minutes do you have?</Question>
        {options.length ? (
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Minutes available">
            {options.map((m) => (
              <Chip key={m} role="radio" selected={minutes === m} className="min-h-14 text-lg" onClick={() => setMinutes(m)}>
                {m} min
              </Chip>
            ))}
          </div>
        ) : (
          <Notice>Today&apos;s session is already as short as we can make it.</Notice>
        )}
        <Button size="lg" disabled={!minutes} onClick={() => minutes && onSubmit({ reason, minutes })}>
          Show me the shorter version
        </Button>
      </>
    );
  }

  if (reason === "equipment-unavailable" && session) {
    return (
      <>
        <Question hint="Only equipment used in today's session is listed.">What isn&apos;t available?</Question>
        {usedEquipment.length ? (
          <EquipmentPicker options={usedEquipment} value={missing} onChange={setMissing} label="Unavailable equipment" />
        ) : (
          <Notice>Today&apos;s workout doesn&apos;t need any equipment — you&apos;re all set.</Notice>
        )}
        <Button size="lg" disabled={!missing.length} onClick={() => onSubmit({ reason, missing })}>
          Find alternatives
        </Button>
      </>
    );
  }

  if (reason === "different-gym" && session) {
    return (
      <>
        <Question hint="Select everything this gym has. Bodyweight exercises are always available.">What does this gym have?</Question>
        <EquipmentPicker options={ALL_EQUIPMENT} value={gymEq} onChange={setGymEq} label="Gym equipment" />
        <Button size="lg" onClick={() => onSubmit({ reason, equipment: gymEq })}>
          Rebuild today for this gym
        </Button>
      </>
    );
  }

  if (reason === "at-home" && session) {
    return (
      <>
        <Question hint="Leave everything unselected for a bodyweight-only session.">What do you have at home?</Question>
        <EquipmentPicker options={ALL_EQUIPMENT} value={homeEq} onChange={setHomeEq} label="Home equipment" />
        <Button size="lg" onClick={() => onSubmit({ reason, equipment: homeEq })}>
          Rebuild today for home
        </Button>
      </>
    );
  }

  if (reason === "too-difficult" && session) {
    return (
      <>
        <Question>What feels too difficult?</Question>
        <div className="flex flex-col gap-3">
          <OptionCard selected={hardKind === "overall"} title="The whole session" description="Easier variations, fewer sets, more rest" onClick={() => setHardKind("overall")} />
          <OptionCard selected={hardKind === "exercise"} title="One exercise" description="Swap it for an easier version" onClick={() => setHardKind("exercise")} />
          <OptionCard
            selected={hardKind === "pain"}
            title="I feel pain or discomfort"
            description="We'll stop and put your wellbeing first"
            onClick={() => setHardKind("pain")}
          />
        </div>
        {hardKind === "exercise" && (
          <ExerciseChooser session={session} value={exerciseId} onChange={setExerciseId} label="Which exercise?" />
        )}
        <Button
          size="lg"
          disabled={!hardKind || (hardKind === "exercise" && !exerciseId)}
          onClick={() => {
            if (hardKind === "overall") onSubmit({ reason, kind: "overall" });
            if (hardKind === "pain") onSubmit({ reason, kind: "pain" });
            if (hardKind === "exercise" && exerciseId) onSubmit({ reason, kind: "exercise", exerciseId });
          }}
        >
          Continue
        </Button>
      </>
    );
  }

  if (reason === "schedule-changed") {
    const moveTargets = Array.from({ length: 6 }, (_, i) => addDays(today, i + 1)).filter((d) => !plannedSessionFor(data, d));
    return (
      <>
        <Question>What would help?</Question>
        <div className="flex flex-col gap-3">
          {session ? (
            <>
              <OptionCard selected={scheduleAction === "rest-today"} title="Make today a rest day" description="No guilt — your Twin rests too" onClick={() => setScheduleAction("rest-today")} />
              <OptionCard
                selected={scheduleAction === "move"}
                title="Move today's workout to another day"
                description={moveTargets.length ? "Choose a rest day in the next 6 days" : "No free days in the next 6 days"}
                disabled={!moveTargets.length}
                className="disabled:opacity-50"
                onClick={() => setScheduleAction("move")}
              />
            </>
          ) : (
            <OptionCard selected={scheduleAction === "train-today"} title="Do my next workout today" description="Bring your next session forward" onClick={() => setScheduleAction("train-today")} />
          )}
          <OptionCard selected={scheduleAction === "change-days"} title="Change my regular training days" description="Updates your plan from today" onClick={() => setScheduleAction("change-days")} />
        </div>
        {scheduleAction === "move" && (
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Move to">
            {moveTargets.map((d) => (
              <MoveChip key={d} date={d} today={today} onPick={() => onSubmit({ reason, action: "move", toDate: d })} />
            ))}
          </div>
        )}
        {scheduleAction === "change-days" && (
          <div>
            <p className="mb-2 font-bold">Which days work for you?</p>
            <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Training days">
              {WEEKDAY_SHORT.map((label, i) => (
                <Chip
                  key={label}
                  selected={days.includes(i)}
                  className="px-0"
                  onClick={() => setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))}
                >
                  {label}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {scheduleAction && scheduleAction !== "move" && (
          <Button
            size="lg"
            disabled={scheduleAction === "change-days" && days.length === 0}
            onClick={() => {
              if (scheduleAction === "rest-today") onSubmit({ reason, action: "rest-today" });
              if (scheduleAction === "train-today") onSubmit({ reason, action: "train-today" });
              if (scheduleAction === "change-days") onSubmit({ reason, action: "change-days", days });
            }}
          >
            Preview change
          </Button>
        )}
      </>
    );
  }

  if (reason === "returning" && session) {
    return (
      <>
        <Question hint="Welcome back! Coming back is the hardest part, and you're doing it.">How long have you been away?</Question>
        <div className="flex flex-col gap-3">
          <OptionCard title="1–2 weeks" onClick={() => onSubmit({ reason, away: "1-2w" })} />
          <OptionCard title="2–4 weeks" onClick={() => onSubmit({ reason, away: "2-4w" })} />
          <OptionCard title="More than a month" onClick={() => onSubmit({ reason, away: "1m+" })} />
        </div>
      </>
    );
  }

  if (reason === "swap-exercise" && session) {
    const alternatives = exerciseId ? replacementOptions(data, session, exerciseId) : [];
    return (
      <>
        <ExerciseChooser session={session} value={exerciseId} onChange={setExerciseId} label="Which exercise would you like to replace?" />
        {exerciseId && (
          <div>
            <p className="mb-2 font-bold">Choose a replacement (same movement)</p>
            {alternatives.length ? (
              <div className="flex flex-col gap-2">
                {alternatives.map((alt) => (
                  <OptionCard
                    key={alt.id}
                    title={alt.name}
                    description={`${alt.summary}${alt.equipment.length ? ` · ${alt.equipment.map((e) => EQUIPMENT_LABEL[e]).join(", ")}` : " · No equipment"}`}
                    onClick={() => onSubmit({ reason, exerciseId, replacementId: alt.id })}
                  />
                ))}
              </div>
            ) : (
              <Notice>No alternatives fit your equipment and limitations for this movement.</Notice>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <Notice>
      Today is a rest day, so there&apos;s nothing to change here. If your schedule changed, choose “My schedule changed”.
    </Notice>
  );
}

function ExerciseChooser({
  session,
  value,
  onChange,
  label,
}: {
  session: PlannedSession;
  value: string | null;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-bold">{label}</legend>
      <div className="flex flex-col gap-2" role="radiogroup">
        {session.exercises.map((pe) => (
          <Chip key={pe.slotId} role="radio" selected={value === pe.exerciseId} className="justify-start" onClick={() => onChange(pe.exerciseId)}>
            {exerciseOrStub(pe.exerciseId).name}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

function MoveChip({ date, today, onPick }: { date: string; today: string; onPick: () => void }) {
  return (
    <Chip role="radio" selected={false} onClick={onPick} aria-label={`Move to ${formatLongDate(date)}`}>
      {relativeDayLabel(date, today)}
    </Chip>
  );
}
