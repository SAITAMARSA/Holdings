"use client";

import clsx from "clsx";
import { Brain, Camera, Check, Dumbbell, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { askCoach, buildContext } from "@/coach/client";
import { QUICK_ACTIONS, type QuickAction } from "@/coach/types";
import { toast } from "@/components/toast";
import { Badge, Button, LinkButton, PageHeader } from "@/components/ui";
import type { CoachAction, CoachMessage } from "@/domain/schema";
import { addMemory } from "@/domain/state";
import { uid } from "@/domain/uid";
import { useToday } from "@/hooks/useClock";
import { now, useAppStore } from "@/store/appStore";

const MAX_MESSAGES = 100;

export default function CoachPage() {
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const today = useToday();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messages = data.coachMessages;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = async (text: string, quickAction?: QuickAction) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setInput("");
    const userMsg: CoachMessage = {
      id: uid("msg"),
      role: "user",
      text: trimmed,
      createdAt: now(),
      source: "user",
      actions: [],
      safety: false,
    };
    update((d) => ({ ...d, coachMessages: [...d.coachMessages, userMsg].slice(-MAX_MESSAGES) }));
    const { reply, notice: n } = await askCoach(trimmed, buildContext(useAppStore.getState().data, today), quickAction);
    setNotice(n ?? null);
    const coachMsg: CoachMessage = {
      id: uid("msg"),
      role: "coach",
      text: reply.text,
      createdAt: now(),
      source: reply.source,
      actions: reply.actions,
      safety: reply.safety,
    };
    update((d) => ({ ...d, coachMessages: [...d.coachMessages, coachMsg].slice(-MAX_MESSAGES) }));
    setBusy(false);
  };

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col gap-4">
      <PageHeader
        title="Coach"
        subtitle="Planning, explanations and adjustments."
        action={
          <LinkButton href="/coach/memory" size="sm" variant="secondary" className="shrink-0 whitespace-nowrap">
            <Brain className="size-4" aria-hidden /> What I know
          </LinkButton>
        }
      />

      <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
        <span className="font-extrabold">Demo coach:</span> replies are scripted examples, not live AI. Any change to your plan is shown as a
        preview first — nothing is applied without your OK.{" "}
        <Link href="/explore/camera" className="inline-flex items-center gap-1 font-extrabold underline">
          <Camera className="size-4" aria-hidden /> Camera coaching preview
        </Link>
      </div>

      <ol className="flex flex-1 flex-col gap-3" aria-label="Conversation" aria-live="polite">
        {messages.length === 0 && (
          <li className="flex items-start gap-2">
            <CoachIcon />
            <div className="max-w-[85%] rounded-3xl rounded-tl-md bg-surface px-4 py-3 shadow-card">
              <p>
                Hi {data.profile?.name}! I&apos;m your coach. I can explain today&apos;s workout, adjust your week, swap exercises, help with
                meals, or ease you back in after a break. Pick a suggestion below or type a question.
              </p>
            </div>
          </li>
        )}
        {messages.map((m) => (
          <li key={m.id} className={clsx("flex items-start gap-2", m.role === "user" && "justify-end")}>
            {m.role === "coach" && <CoachIcon />}
            <div
              className={clsx(
                "max-w-[85%] rounded-3xl px-4 py-3",
                m.role === "user"
                  ? "rounded-tr-md bg-brand-600 text-white"
                  : clsx("rounded-tl-md bg-surface shadow-card", m.safety && "border-2 border-coral-500/40"),
              )}
            >
              {m.role === "coach" && (
                <p className="mb-1 flex flex-wrap gap-1.5">
                  {m.source === "demo" && <Badge tone="neutral">Demo response</Badge>}
                  {m.safety && <Badge tone="coral">Safety</Badge>}
                </p>
              )}
              <p className="whitespace-pre-line">{m.text}</p>
              {m.actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.actions.map((a, i) => (
                    <ActionButton key={i} action={a} />
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
        {busy && (
          <li className="flex items-center gap-2 text-sm text-muted">
            <CoachIcon /> Coach is typing…
          </li>
        )}
      </ol>
      <div ref={endRef} />

      {notice && <p className="text-sm text-muted">{notice}</p>}

      <div className="sticky bottom-20 z-10 flex flex-col gap-2 bg-canvas/95 pb-2 pt-1 lg:bottom-0">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Suggestions">
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q.id}
              type="button"
              disabled={busy}
              onClick={() => send(q.message, q.id)}
              className="min-h-11 shrink-0 rounded-full border-2 border-brand-200 bg-surface px-4 text-sm font-extrabold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <label htmlFor="coach-input" className="sr-only">
            Message your coach
          </label>
          <input
            id="coach-input"
            value={input}
            maxLength={1000}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach…"
            className="min-h-12 min-w-0 flex-1 rounded-2xl border-2 border-line bg-surface px-4 outline-none focus:border-brand-500"
          />
          <Button type="submit" disabled={busy || !input.trim()} aria-label="Send">
            <SendHorizontal className="size-5" aria-hidden />
          </Button>
        </form>
      </div>

    </div>
  );
}

function CoachIcon() {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white" aria-hidden>
      <Dumbbell className="size-4" />
    </span>
  );
}

function ActionButton({ action }: { action: CoachAction }) {
  const memory = useAppStore((s) => s.data.memory);
  const update = useAppStore((s) => s.update);
  if (action.type === "open-adjust") {
    return (
      <LinkButton href={`/adjust?reason=${action.reason}`} size="sm" variant="secondary">
        {action.label}
      </LinkButton>
    );
  }
  if (action.type === "navigate") {
    return (
      <LinkButton href={action.href} size="sm" variant="secondary">
        {action.label}
      </LinkButton>
    );
  }
  const saved = memory.some((m) => m.text.toLowerCase() === action.text.toLowerCase());
  return saved ? (
    <span className="inline-flex min-h-10 items-center gap-1 text-sm font-extrabold text-mint-700">
      <Check className="size-4" aria-hidden /> Saved to memory
    </span>
  ) : (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        update((d) => addMemory(d, { text: action.text, category: action.category, source: "you-told-coach" }, now()));
        toast("Saved to coach memory");
      }}
    >
      {action.label}
    </Button>
  );
}
