"use client";

import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/toast";
import { Badge, Button, Card, EmptyState, IconButton, LinkButton, PageHeader, SectionTitle, Sheet } from "@/components/ui";
import { WEEKDAY_SHORT, formatShortDate } from "@/domain/dates";
import { EQUIPMENT_LABEL } from "@/domain/exercises";
import { ALLERGEN_LABEL, DIET_LABEL } from "@/domain/meals";
import { equipmentProfileFor } from "@/domain/plan";
import type { MemoryItem } from "@/domain/schema";
import { addMemory } from "@/domain/state";
import { now, useAppStore } from "@/store/appStore";

const SOURCE_LABEL: Record<MemoryItem["source"], string> = {
  "you-told-coach": "You told your coach",
  "check-in": "From a check-in you accepted",
  adjustment: "From a lasting change you chose",
};

const GOAL_LABEL = { habit: "Build a steady habit", strength: "Get stronger", muscle: "Build muscle", fitness: "Feel fitter" };

export default function MemoryPage() {
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const [editing, setEditing] = useState<MemoryItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const p = data.profile!;
  const home = equipmentProfileFor(data, "home");
  const gym = equipmentProfileFor(data, "gym");
  const eq = (list: string[]) => (list.length ? list.map((e) => EQUIPMENT_LABEL[e as keyof typeof EQUIPMENT_LABEL]).join(", ") : "Bodyweight only");

  const facts: [string, string][] = [
    ["Name", p.name],
    ["Experience", p.experience === "new" ? "New to fitness" : "Already trains"],
    ["Detail shown", p.displayDetail === "simple" ? "Simple, plain language" : "Detailed (sets, reps, loads)"],
    ["Goal", GOAL_LABEL[p.goal]],
    ["Usually trains", p.location === "both" ? "Gym and home" : p.location === "home" ? "At home" : "At the gym"],
    ["Training days", p.trainingDays.map((d) => WEEKDAY_SHORT[d]).join(", ") || "None"],
    ["Session length", `About ${p.sessionMinutes} minutes`],
    ["Intensity", p.intensity === "gentle" ? "Gentle" : p.intensity === "challenging" ? "Challenging" : "Standard"],
    [
      "Go easy on",
      p.limitationsStatus === "skipped" ? "Not shared (skipped)" : p.limitations.length ? p.limitations.join(", ") : "Nothing",
    ],
    ["Home equipment", `${eq(home.equipment)}${home.confirmed ? "" : " (default guess)"}`],
    ["Gym equipment", `${eq(gym.equipment)}${gym.confirmed ? "" : " (default guess)"}`],
  ];
  if (data.meals.prefs) {
    const m = data.meals.prefs;
    facts.push(["Diet", DIET_LABEL[m.diet]]);
    facts.push(["Allergies", m.allergies.length ? m.allergies.map((a) => ALLERGEN_LABEL[a]).join(", ") : "None listed"]);
  }

  const saveEdit = () => {
    if (!editing || !text.trim()) return;
    update((d) => ({
      ...d,
      memory: d.memory.map((m) => (m.id === editing.id ? { ...m, text: text.trim().slice(0, 200), updatedAt: now() } : m)),
    }));
    setEditing(null);
    toast("Note updated");
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        back={
          <LinkButton href="/coach" variant="ghost" size="sm" className="-ml-3">
            <ArrowLeft className="size-5" aria-hidden /> Coach
          </LinkButton>
        }
        title="What your coach knows"
        subtitle="Everything here is stored only in this browser. Your coach never infers sensitive information."
      />

      <Card aria-labelledby="profile-title">
        <SectionTitle id="profile-title" action={<LinkButton href="/settings" size="sm" variant="secondary">Edit</LinkButton>}>
          From your profile
        </SectionTitle>
        <dl className="divide-y divide-line">
          {facts.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-bold">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card aria-labelledby="notes-title">
        <SectionTitle
          id="notes-title"
          action={
            <Button size="sm" variant="secondary" onClick={() => { setText(""); setAdding(true); }}>
              <Plus className="size-4" aria-hidden /> Add
            </Button>
          }
        >
          Remembered preferences
        </SectionTitle>
        {data.memory.length === 0 ? (
          <EmptyState title="Nothing remembered yet">
            Your coach only remembers things you confirm — like choosing “from now on” in Adjust today, accepting a check-in, or saying
            “remember that…” in chat.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {data.memory.map((m) => (
              <li key={m.id} className="flex items-start gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{m.text}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Badge tone="neutral">{m.category}</Badge>
                    {SOURCE_LABEL[m.source]} · {formatShortDate(new Date(m.updatedAt).toISOString().slice(0, 10))}
                  </p>
                </div>
                <IconButton label={`Edit “${m.text}”`} onClick={() => { setEditing(m); setText(m.text); }}>
                  <Pencil className="size-5" />
                </IconButton>
                <IconButton
                  label={`Delete “${m.text}”`}
                  className="text-coral-700"
                  onClick={() => {
                    update((d) => ({ ...d, memory: d.memory.filter((x) => x.id !== m.id) }));
                    toast("Deleted");
                  }}
                >
                  <Trash2 className="size-5" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">
          Deleting a note doesn&apos;t change your plan. To change your plan, edit your profile or use Adjust today.
        </p>
      </Card>

      <Card aria-labelledby="chat-title">
        <SectionTitle id="chat-title">Chat history</SectionTitle>
        <p className="text-sm text-muted">{data.coachMessages.length} messages stored in this browser.</p>
        <Button size="sm" variant="secondary" className="mt-3" disabled={!data.coachMessages.length} onClick={() => setConfirmClear(true)}>
          Clear chat history
        </Button>
      </Card>

      <Sheet open={Boolean(editing) || adding} onOpenChange={(o) => { if (!o) { setEditing(null); setAdding(false); } }} title={adding ? "Add a note for your coach" : "Edit note"}>
        <label htmlFor="mem-text" className="font-bold">
          Note
        </label>
        <input
          id="mem-text"
          value={text}
          maxLength={200}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-2xl border-2 border-line px-4 outline-none focus:border-brand-500"
          placeholder="e.g. Prefers morning workouts"
        />
        <p className="mt-2 text-xs text-muted">Please don&apos;t add medical details. Use profile limitations for areas to go easy on.</p>
        <Button
          className="mt-4 w-full"
          disabled={!text.trim()}
          onClick={() => {
            if (adding) {
              update((d) => addMemory(d, { text: text.trim().slice(0, 200), category: "other", source: "you-told-coach" }, now()));
              setAdding(false);
              toast("Note added");
            } else saveEdit();
          }}
        >
          Save
        </Button>
      </Sheet>

      <Sheet open={confirmClear} onOpenChange={setConfirmClear} title="Clear chat history?">
        <p className="text-muted">Messages are deleted from this browser. Remembered preferences are kept.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="danger"
            onClick={() => {
              update((d) => ({ ...d, coachMessages: [] }));
              setConfirmClear(false);
              toast("Chat cleared");
            }}
          >
            Clear chat
          </Button>
          <Button variant="secondary" onClick={() => setConfirmClear(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
