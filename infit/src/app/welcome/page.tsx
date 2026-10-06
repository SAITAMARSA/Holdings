"use client";

import clsx from "clsx";
import { ArrowLeft, Dumbbell, Home, Building2, Repeat, Sprout, TrendingUp, Zap, HeartPulse, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/AppShell";
import { TwinAvatar } from "@/components/TwinAvatar";
import { Button, Chip, Notice, OptionCard } from "@/components/ui";
import { now, useAppStore } from "@/store/appStore";
import type { Goal, Limitation, TrainingLocation, TwinColor } from "@/domain/schema";
import { completeOnboarding, isOnboardingComplete, type OnboardingAnswers } from "@/domain/state";
import { TWIN_COLORS } from "@/domain/twin";

const STEPS = ["intro", "name", "experience", "goal", "location", "days", "minutes", "limitations", "twin", "review"] as const;

const GOALS: { id: Goal; title: string; description: string; icon: ReactNode }[] = [
  {
    id: "habit",
    title: "Build a steady habit",
    description: "Show up regularly without it taking over",
    icon: <Repeat className="size-5" />,
  },
  {
    id: "strength",
    title: "Get stronger",
    description: "Lift, push and pull more over time",
    icon: <Dumbbell className="size-5" />,
  },
  {
    id: "muscle",
    title: "Build muscle",
    description: "More training volume, steady progression",
    icon: <TrendingUp className="size-5" />,
  },
  {
    id: "fitness",
    title: "Feel fitter and more energetic",
    description: "Strength plus some heart-and-lungs work",
    icon: <HeartPulse className="size-5" />,
  },
];

const LOCATIONS: { id: TrainingLocation; title: string; description: string; icon: ReactNode }[] = [
  { id: "home", title: "At home", description: "We'll start with no equipment", icon: <Home className="size-5" /> },
  { id: "gym", title: "At a gym", description: "We'll assume a typical gym", icon: <Building2 className="size-5" /> },
  {
    id: "both",
    title: "A bit of both",
    description: "Gym plan, easy to switch on home days",
    icon: <Sparkles className="size-5" />,
  },
];

const LIMITS: { id: Limitation; label: string }[] = [
  { id: "knees", label: "Knees" },
  { id: "lower-back", label: "Lower back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "wrists", label: "Wrists" },
];

function CoachBubble({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex animate-rise items-start gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white" aria-hidden>
        <Dumbbell className="size-5" />
      </span>
      <div className="rounded-3xl rounded-tl-md bg-surface px-4 py-3 shadow-card">
        <h1 className="text-xl font-black leading-snug sm:text-2xl">{children}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const enterDemo = useAppStore((s) => s.enterDemo);
  const storeNotice = useAppStore((s) => s.notice);
  const dismissNotice = useAppStore((s) => s.dismissNotice);
  const { step, answers } = data.onboarding.draft;
  const [nameInput, setNameInput] = useState(answers.name ?? "");
  const [nickname, setNickname] = useState(answers.twinNickname ?? "");
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.onboarding.completed) router.replace("/today");
  }, [data.onboarding.completed, router]);

  // Move focus to the new question for screen-reader and keyboard users
  // (the name step focuses its text field instead).
  useEffect(() => {
    const h1 = headingRef.current?.querySelector<HTMLElement>("h1");
    h1?.setAttribute("tabindex", "-1");
    if (step > 0 && STEPS[step] !== "name") h1?.focus();
  }, [step]);

  const save = (patch: Partial<OnboardingAnswers>, nextStep?: number) =>
    update((d) => ({
      ...d,
      onboarding: {
        ...d.onboarding,
        draft: { step: nextStep ?? d.onboarding.draft.step, answers: { ...d.onboarding.draft.answers, ...patch } },
      },
    }));
  const go = (s: number) => {
    setError(null);
    save({}, s);
  };
  const answerAndNext = (patch: Partial<OnboardingAnswers>) => save(patch, step + 1);

  const finish = () => {
    const final = { ...answers, twinNickname: nickname.trim() };
    if (!isOnboardingComplete(final)) {
      setError("A couple of answers are missing — please go back and check.");
      return;
    }
    update((d) => completeOnboarding(d, final, now()));
    router.replace("/today");
  };

  const name = answers.name ?? "";
  const kind = STEPS[step] ?? "intro";
  const progress = Math.round((step / (STEPS.length - 1)) * 100);
  const twinColor: TwinColor = answers.twinColor ?? "violet";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => go(step - 1)}
            className="flex size-11 items-center justify-center rounded-2xl hover:bg-sunken"
            aria-label="Back to previous question"
          >
            <ArrowLeft className="size-6" />
          </button>
        ) : (
          <Logo />
        )}
        {step > 0 && (
          <div
            className="h-3 flex-1 overflow-hidden rounded-full bg-sunken"
            role="progressbar"
            aria-label="Setup progress"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-aqua-500 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {storeNotice && (
        <Notice tone="warning" className="mb-4">
          {storeNotice}{" "}
          <button type="button" className="font-extrabold underline" onClick={dismissNotice}>
            Dismiss
          </button>
        </Notice>
      )}

      <main id="main" ref={headingRef} key={kind} className="flex flex-1 flex-col gap-6">
        {kind === "intro" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="animate-pop">
              <TwinAvatar color="violet" expression="excited" size={200} animate label="An Infit Twin waving hello" />
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Your fitness routine adapts with your life.</h1>
            <p className="mt-3 max-w-md text-lg text-muted">
              A coach that plans and adjusts with you, and a Twin that trains alongside you. Setup takes about a minute.
            </p>
            <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
              <Button size="lg" onClick={() => go(1)}>
                {answers.name ? "Continue setting up" : "Let's get started"}
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await enterDemo();
                  router.replace("/today");
                }}
              >
                Explore the demo first
              </Button>
            </div>
            <p className="mt-6 max-w-sm text-sm text-muted">
              Your answers are saved in this browser only — no account needed. The demo uses separate sample data.
            </p>
          </div>
        )}

        {kind === "name" && (
          <>
            <CoachBubble sub="Hi! I'm your Infit coach. I'll plan your sessions and adjust them when life gets in the way.">
              First, what should I call you?
            </CoachBubble>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const n = nameInput.trim();
                if (!n) return setError("Please enter a name — a nickname is fine.");
                answerAndNext({ name: n.slice(0, 40) });
              }}
            >
              <label htmlFor="name" className="font-bold">
                Your preferred name
              </label>
              <input
                id="name"
                autoFocus
                autoComplete="given-name"
                maxLength={40}
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setError(null);
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "name-error" : undefined}
                className="min-h-14 rounded-2xl border-2 border-line bg-surface px-4 text-lg font-bold outline-none focus:border-brand-500"
              />
              {error && (
                <p id="name-error" className="text-sm font-bold text-coral-700">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="mt-2">
                Continue
              </Button>
            </form>
          </>
        )}

        {kind === "experience" && (
          <>
            <CoachBubble sub="This helps me pitch things right. You can change it anytime.">
              Nice to meet you, {name}! Which sounds more like you?
            </CoachBubble>
            <div className="flex flex-col gap-3">
              <OptionCard
                selected={answers.experience === "new"}
                icon={<Sprout className="size-5" />}
                title="I'm new to fitness"
                description="Simple steps, plain language and explanations"
                onClick={() => answerAndNext({ experience: "new" })}
              />
              <OptionCard
                selected={answers.experience === "experienced"}
                icon={<Zap className="size-5" />}
                title="I already train"
                description="Structure, progression, sets, reps and loads"
                onClick={() => answerAndNext({ experience: "experienced" })}
              />
            </div>
          </>
        )}

        {kind === "goal" && (
          <>
            <CoachBubble sub="Pick the one that matters most right now.">
              {answers.experience === "new" ? "Great place to start. " : "Love it. "}What would you most like from training?
            </CoachBubble>
            <div className="flex flex-col gap-3">
              {GOALS.map((g) => (
                <OptionCard
                  key={g.id}
                  selected={answers.goal === g.id}
                  icon={g.icon}
                  title={g.title}
                  description={g.description}
                  onClick={() => answerAndNext({ goal: g.id })}
                />
              ))}
            </div>
          </>
        )}

        {kind === "location" && (
          <>
            <CoachBubble sub="I'll ask about specific equipment later, only when it matters.">
              Where will you usually train?
            </CoachBubble>
            <div className="flex flex-col gap-3">
              {LOCATIONS.map((l) => (
                <OptionCard
                  key={l.id}
                  selected={answers.location === l.id}
                  icon={l.icon}
                  title={l.title}
                  description={l.description}
                  onClick={() => answerAndNext({ location: l.id })}
                />
              ))}
            </div>
          </>
        )}

        {kind === "days" && (
          <>
            <CoachBubble sub="Think of a normal busy week, not your best one. It's easy to change later.">
              How many days a week is realistic right now?
            </CoachBubble>
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Training days per week">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Chip
                  key={n}
                  role="radio"
                  selected={answers.daysPerWeek === n}
                  className="min-h-16 flex-col text-lg"
                  onClick={() => answerAndNext({ daysPerWeek: n })}
                >
                  {n}
                  <span className="text-xs font-bold text-muted">
                    {n === 1 ? "day" : "days"}
                    {answers.experience === "new" && (n === 2 || n === 3) ? " · good start" : ""}
                  </span>
                </Chip>
              ))}
            </div>
          </>
        )}

        {kind === "minutes" && (
          <>
            <CoachBubble sub="Including a short warm-up. Shorter sessions you'll actually do beat long ones you skip.">
              And about how long per session?
            </CoachBubble>
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Minutes per session">
              {[15, 20, 30, 45, 60].map((m) => (
                <Chip
                  key={m}
                  role="radio"
                  selected={answers.sessionMinutes === m}
                  className="min-h-16 flex-col text-lg"
                  onClick={() => answerAndNext({ sessionMinutes: m })}
                >
                  {m}
                  <span className="text-xs font-bold text-muted">minutes</span>
                </Chip>
              ))}
            </div>
          </>
        )}

        {kind === "limitations" && (
          <LimitationsStep
            initial={answers.limitations ?? []}
            onDone={(limitations) => answerAndNext({ limitations, limitationsStatus: "answered" })}
            onSkip={() => answerAndNext({ limitations: [], limitationsStatus: "skipped" })}
          />
        )}

        {kind === "twin" && (
          <>
            <CoachBubble sub="Your Twin follows the same plan as you, cheers you on and earns fun accessories. It's not your coach — that's me.">
              Last thing — meet your Fitness Twin!
            </CoachBubble>
            <div className="flex justify-center">
              <TwinAvatar
                color={twinColor}
                expression="excited"
                size={170}
                animate
                label={`Your Twin in ${TWIN_COLORS[twinColor].name}`}
              />
            </div>
            <fieldset>
              <legend className="mb-2 font-bold">Pick a colour</legend>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Twin colour">
                {(Object.keys(TWIN_COLORS) as TwinColor[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={twinColor === c}
                    onClick={() => save({ twinColor: c })}
                    className={clsx(
                      "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-xs font-bold",
                      twinColor === c ? "border-brand-600 bg-brand-50" : "border-line bg-surface hover:border-brand-300",
                    )}
                  >
                    <span
                      className="size-7 rounded-full border-2 border-white shadow"
                      style={{ background: TWIN_COLORS[c].body }}
                      aria-hidden
                    />
                    {TWIN_COLORS[c].name}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted">
                Colours are just for fun — they don&apos;t say anything about you or your ability.
              </p>
            </fieldset>
            <div className="flex flex-col gap-2">
              <label htmlFor="nick" className="font-bold">
                Nickname <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="nick"
                maxLength={24}
                value={nickname}
                placeholder="e.g. Mika"
                onChange={(e) => setNickname(e.target.value)}
                className="min-h-12 rounded-2xl border-2 border-line bg-surface px-4 font-bold outline-none focus:border-brand-500"
              />
            </div>
            <Button size="lg" onClick={() => answerAndNext({ twinColor, twinNickname: nickname.trim() })}>
              Continue
            </Button>
          </>
        )}

        {kind === "review" && (
          <>
            <CoachBubble sub="Tap any answer to change it. You can also edit these later in Settings.">
              Here&apos;s what I&apos;ve got, {name}.
            </CoachBubble>
            <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
              {[
                ["Name", answers.name, 1],
                ["Experience", answers.experience === "new" ? "New to fitness" : "Already training", 2],
                ["Goal", GOALS.find((g) => g.id === answers.goal)?.title, 3],
                ["Where", LOCATIONS.find((l) => l.id === answers.location)?.title, 4],
                ["Days per week", answers.daysPerWeek, 5],
                ["Session length", answers.sessionMinutes ? `${answers.sessionMinutes} min` : undefined, 6],
                [
                  "Go easy on",
                  answers.limitationsStatus === "skipped"
                    ? "Skipped"
                    : answers.limitations?.length
                      ? answers.limitations.map((l) => LIMITS.find((x) => x.id === l)?.label).join(", ")
                      : "Nothing",
                  7,
                ],
                ["Twin", `${TWIN_COLORS[twinColor].name}${answers.twinNickname ? ` · ${answers.twinNickname}` : ""}`, 8],
              ].map(([label, value, s]) => (
                <li key={label as string}>
                  <button
                    type="button"
                    onClick={() => go(s as number)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left hover:bg-sunken"
                  >
                    <span className="text-muted">{label}</span>
                    <span className="font-extrabold">{value ?? <span className="text-coral-700">Missing</span>}</span>
                  </button>
                </li>
              ))}
            </ul>
            {error && <Notice tone="warning">{error}</Notice>}
            <Button size="lg" onClick={finish}>
              Build my plan
            </Button>
          </>
        )}
      </main>
    </div>
  );
}

function LimitationsStep({
  initial,
  onDone,
  onSkip,
}: {
  initial: Limitation[];
  onDone: (l: Limitation[]) => void;
  onSkip: () => void;
}) {
  const [selected, setSelected] = useState<Limitation[]>(initial);
  const toggle = (l: Limitation) => setSelected((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]));
  return (
    <>
      <CoachBubble sub="Optional. Choose any areas where you'd like to avoid heavy or awkward loading.">
        Is there anything we should go easy on?
      </CoachBubble>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Areas to go easy on">
        {LIMITS.map((l) => (
          <Chip key={l.id} selected={selected.includes(l.id)} onClick={() => toggle(l.id)}>
            {l.label}
          </Chip>
        ))}
      </div>
      <Notice tone="info" title="What this does — and doesn't do">
        We&apos;ll avoid exercises that tend to load these areas heavily. We can&apos;t account for specific injuries, conditions
        or pain — if you&apos;re unsure what&apos;s safe for you, check with a health professional.
      </Notice>
      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={() => onDone(selected)}>
          {selected.length ? "Continue" : "Nothing to avoid — continue"}
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <p className="text-center text-sm text-muted">
          If you skip, we&apos;ll use standard exercises and can&apos;t tailor around any limitations. You can add them later in
          Settings.
        </p>
      </div>
    </>
  );
}
