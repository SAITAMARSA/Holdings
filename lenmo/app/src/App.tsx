import { useState } from "react";
import { useLearner } from "./lib/store";
import Onboarding from "./screens/Onboarding";
import Learn from "./screens/Learn";
import Challenge from "./screens/Challenge";
import Study from "./screens/Study";
import Progress from "./screens/Progress";

export type Tab = "learn" | "challenge" | "study" | "progress";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "learn", label: "Learn", icon: "✦" },
  { id: "challenge", label: "Challenge", icon: "⚡" },
  { id: "study", label: "Study", icon: "◔" },
  { id: "progress", label: "Progress", icon: "▲" },
];

export default function App() {
  const learner = useLearner();
  const [tab, setTab] = useState<Tab>("learn");

  if (!learner.profile) return <Onboarding />;

  const accent = learner.profile.twin.colour;
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col" style={{ ["--accent" as string]: accent }}>
      <header className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2">
        <span className="text-xl font-bold tracking-tight">lenmo</span>
        <span className="flex items-center gap-2 text-sm text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
          {learner.profile.twin.name}
        </span>
      </header>
      <main className="flex-1 overflow-y-auto px-4 pb-24">
        {tab === "learn" && <Learn />}
        {tab === "challenge" && <Challenge />}
        {tab === "study" && <Study />}
        {tab === "progress" && <Progress />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-ink-line bg-ink/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${tab === t.id ? "text-mint-300" : "text-slate-400"}`}>
              <span className="text-lg leading-none">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
