"use client";

import { Download, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "@/components/toast";
import { Button, Card, Chip, Notice, PageHeader, SectionTitle, Sheet } from "@/components/ui";
import { WEEKDAY_SHORT, todayISO } from "@/domain/dates";
import { ALL_EQUIPMENT, EQUIPMENT_LABEL } from "@/domain/exercises";
import { equipmentProfileFor } from "@/domain/plan";
import type { AppData, Equipment, Profile } from "@/domain/schema";
import { regeneratePlan } from "@/domain/state";
import { exportJSON } from "@/storage/repository";
import { now, useAppStore } from "@/store/appStore";

const PLAN_FIELDS: (keyof Profile)[] = ["experience", "goal", "location", "sessionMinutes", "trainingDays", "limitations", "intensity"];

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <fieldset className="py-3">
      <legend className="mb-2 font-extrabold">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
    </fieldset>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const storageDescription = useAppStore((s) => s.storageDescription);
  const resetCurrent = useAppStore((s) => s.resetCurrent);
  const exitDemo = useAppStore((s) => s.exitDemo);
  const [draft, setDraft] = useState<Profile>(data.profile!);
  const [home, setHome] = useState<Equipment[]>(equipmentProfileFor(data, "home").equipment);
  const [gym, setGym] = useState<Equipment[]>(equipmentProfileFor(data, "gym").equipment);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const p = data.profile!;
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const planChanged = PLAN_FIELDS.some((k) => JSON.stringify(draft[k]) !== JSON.stringify(p[k]));
  const equipmentChanged =
    JSON.stringify(home) !== JSON.stringify(equipmentProfileFor(data, "home").equipment) ||
    JSON.stringify(gym) !== JSON.stringify(equipmentProfileFor(data, "gym").equipment);
  const dirty = JSON.stringify(draft) !== JSON.stringify(p) || equipmentChanged;
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const save = () => {
    if (!draft.name.trim()) return setError("Please enter a name.");
    if (draft.trainingDays.length === 0) return setError("Choose at least one training day.");
    setError(null);
    const profile: Profile = {
      ...draft,
      name: draft.name.trim().slice(0, 40),
      trainingDays: [...draft.trainingDays].sort((a, b) => a - b),
      daysPerWeek: draft.trainingDays.length,
      limitationsStatus: draft.limitationsStatus === "skipped" && draft.limitations.length ? "answered" : draft.limitationsStatus,
    };
    update((d) => {
      let next: AppData = {
        ...d,
        profile,
        equipmentProfiles: d.equipmentProfiles.map((e) =>
          e.kind === "home"
            ? { ...e, equipment: home, confirmed: e.confirmed || JSON.stringify(home) !== JSON.stringify(e.equipment) }
            : { ...e, equipment: gym, confirmed: e.confirmed || JSON.stringify(gym) !== JSON.stringify(e.equipment) },
        ),
      };
      if (planChanged || equipmentChanged) next = regeneratePlan(next, "Profile updated in Settings.", todayISO(), now());
      return next;
    });
    toast(planChanged || equipmentChanged ? "Saved — plan rebuilt from today" : "Saved");
  };

  const download = () => {
    const blob = new Blob([exportJSON(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infit-${data.mode}-export-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Export downloaded");
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle="Edit your answers anytime." />

      <Card aria-labelledby="profile-title">
        <SectionTitle id="profile-title">Profile & training</SectionTitle>
        <div className="divide-y divide-line">
          <div className="py-3">
            <label htmlFor="s-name" className="mb-2 block font-extrabold">
              Preferred name
            </label>
            <input
              id="s-name"
              value={draft.name}
              maxLength={40}
              onChange={(e) => set("name", e.target.value)}
              className="min-h-12 w-full rounded-2xl border-2 border-line px-4 font-bold outline-none focus:border-brand-500"
            />
          </div>
          <Field label="Experience">
            <Chip selected={draft.experience === "new"} onClick={() => set("experience", "new")}>New to fitness</Chip>
            <Chip selected={draft.experience === "experienced"} onClick={() => set("experience", "experienced")}>I already train</Chip>
          </Field>
          <Field label="Detail shown" hint="Separate from experience: beginners can see full detail, and experienced lifters can keep it simple.">
            <Chip selected={draft.displayDetail === "simple"} onClick={() => set("displayDetail", "simple")}>Simple</Chip>
            <Chip selected={draft.displayDetail === "detailed"} onClick={() => set("displayDetail", "detailed")}>Detailed (sets, reps, loads)</Chip>
          </Field>
          <Field label="Main goal">
            {(
              [
                ["habit", "Steady habit"],
                ["strength", "Get stronger"],
                ["muscle", "Build muscle"],
                ["fitness", "Fitter & more energy"],
              ] as const
            ).map(([v, l]) => (
              <Chip key={v} selected={draft.goal === v} onClick={() => set("goal", v)}>{l}</Chip>
            ))}
          </Field>
          <Field label="Where you train">
            {(
              [
                ["home", "Home"],
                ["gym", "Gym"],
                ["both", "Both"],
              ] as const
            ).map(([v, l]) => (
              <Chip key={v} selected={draft.location === v} onClick={() => set("location", v)}>{l}</Chip>
            ))}
          </Field>
          <Field label="Training days">
            <div className="grid w-full grid-cols-7 gap-1.5">
              {WEEKDAY_SHORT.map((l, i) => (
                <Chip key={l} selected={draft.trainingDays.includes(i)} className="px-0" onClick={() => set("trainingDays", toggle(draft.trainingDays, i))}>
                  {l}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Session length">
            {[15, 20, 30, 45, 60].map((m) => (
              <Chip key={m} selected={draft.sessionMinutes === m} onClick={() => set("sessionMinutes", m)}>{m} min</Chip>
            ))}
          </Field>
          <Field label="Intensity">
            {(
              [
                ["gentle", "Gentle"],
                ["standard", "Standard"],
                ["challenging", "Challenging"],
              ] as const
            ).map(([v, l]) => (
              <Chip key={v} selected={draft.intensity === v} onClick={() => set("intensity", v)}>{l}</Chip>
            ))}
          </Field>
          <Field
            label="Go easy on"
            hint={
              draft.limitationsStatus === "skipped" && draft.limitations.length === 0
                ? "You skipped this. We use standard exercises and can't tailor around limitations."
                : "We avoid exercises that load these areas heavily. This isn't medical advice."
            }
          >
            {(
              [
                ["knees", "Knees"],
                ["lower-back", "Lower back"],
                ["shoulders", "Shoulders"],
                ["wrists", "Wrists"],
              ] as const
            ).map(([v, l]) => (
              <Chip
                key={v}
                selected={draft.limitations.includes(v)}
                onClick={() => setDraft((d) => ({ ...d, limitations: toggle(d.limitations, v), limitationsStatus: "answered" }))}
              >
                {l}
              </Chip>
            ))}
          </Field>
          <Field label="Weight units">
            <Chip selected={draft.units === "kg"} onClick={() => set("units", "kg")}>kg</Chip>
            <Chip selected={draft.units === "lb"} onClick={() => set("units", "lb")}>lb</Chip>
          </Field>
        </div>
      </Card>

      <Card aria-labelledby="eq-title">
        <SectionTitle id="eq-title">Equipment</SectionTitle>
        <Field label="At home" hint={home.length ? undefined : "Bodyweight only"}>
          {ALL_EQUIPMENT.map((e) => (
            <Chip key={e} selected={home.includes(e)} onClick={() => setHome((h) => toggle(h, e))}>{EQUIPMENT_LABEL[e]}</Chip>
          ))}
        </Field>
        <Field label="At your gym">
          {ALL_EQUIPMENT.map((e) => (
            <Chip key={e} selected={gym.includes(e)} onClick={() => setGym((g) => toggle(g, e))}>{EQUIPMENT_LABEL[e]}</Chip>
          ))}
        </Field>
      </Card>

      {error && <Notice tone="warning">{error}</Notice>}
      {dirty && (
        <div className="sticky bottom-20 z-10 flex flex-col gap-2 rounded-3xl border-2 border-brand-200 bg-surface p-4 shadow-lift lg:bottom-4">
          <p className="text-sm font-bold">
            {planChanged || equipmentChanged
              ? "Saving will rebuild your plan from today. Past sessions, adjustments and history are kept."
              : "You have unsaved changes."}
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={save}>Save changes</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(p);
                setHome(equipmentProfileFor(data, "home").equipment);
                setGym(equipmentProfileFor(data, "gym").equipment);
              }}
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      <Card aria-labelledby="a11y-title">
        <SectionTitle id="a11y-title">Accessibility</SectionTitle>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={data.settings.reduceMotion}
            onChange={(e) => update((d) => ({ ...d, settings: { ...d.settings, reduceMotion: e.target.checked } }))}
            className="mt-1 size-5 accent-brand-600"
          />
          <span>
            <span className="block font-extrabold">Reduce motion</span>
            <span className="block text-sm text-muted">Turns off animations. Infit also follows your device&apos;s reduced-motion setting.</span>
          </span>
        </label>
      </Card>

      <Card aria-labelledby="data-title">
        <SectionTitle id="data-title">Your data</SectionTitle>
        <p className="text-sm">{storageDescription}</p>
        <p className="mt-1 text-sm text-muted">
          Clearing your browser data removes it. There&apos;s no account or cloud backup in this version, so export a copy if you want one.
        </p>
        {data.mode === "demo" && (
          <Notice tone="demo" className="mt-3">
            You&apos;re in demo mode. Demo data is stored separately and never mixed with your own.
          </Notice>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={download}>
            <Download className="size-5" aria-hidden /> Export my data (JSON)
          </Button>
          <Button variant="outline" className="text-coral-700" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="size-5" aria-hidden /> {data.mode === "demo" ? "Reset demo" : "Reset everything"}
          </Button>
          {data.mode === "demo" && (
            <Button
              variant="secondary"
              onClick={async () => {
                await exitDemo();
                router.replace("/");
              }}
            >
              Exit demo
            </Button>
          )}
        </div>
      </Card>

      <Card aria-labelledby="about-title">
        <SectionTitle id="about-title">About this version</SectionTitle>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>The coach uses scripted demo responses — not live AI.</li>
          <li>Explore shows sample listings only; local search isn&apos;t connected.</li>
          <li>Meal costs and nutrition are rough estimates, not live prices or verified values.</li>
          <li>Camera coaching is a preview only; the camera is never used.</li>
          <li>Infit is a fitness aid, not medical advice. Results aren&apos;t guaranteed.</li>
        </ul>
      </Card>

      <Sheet open={confirmReset} onOpenChange={setConfirmReset} title={data.mode === "demo" ? "Reset the demo?" : "Reset everything?"}>
        <p className="text-muted">
          {data.mode === "demo"
            ? "The demo returns to its starting sample data. Your own data isn't affected."
            : "This deletes your profile, plan, workout history, Twin and preferences from this browser. It can't be undone. Export first if you want a copy."}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="danger"
            onClick={async () => {
              await resetCurrent();
              setConfirmReset(false);
              router.replace("/");
            }}
          >
            {data.mode === "demo" ? "Reset demo" : "Delete my data"}
          </Button>
          <Button variant="secondary" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
