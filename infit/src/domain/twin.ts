import { daysBetween, type ISODate } from "./dates";
import { daysSinceLastSession, weekSummary } from "./progress";
import type { AppData, TwinColor } from "./schema";
import { RETURN_GAP_DAYS } from "./session";
import { twinDisplayName } from "./state";

export type Expression = "happy" | "excited" | "calm" | "sleepy" | "caring" | "determined";

export const TWIN_COLORS: Record<TwinColor, { name: string; body: string; shade: string; belly: string }> = {
  violet: { name: "Violet", body: "#8B6CF6", shade: "#6A48E8", belly: "#C4B2FF" },
  aqua: { name: "Aqua", body: "#3CCFC4", shade: "#14A99F", belly: "#A8EEE8" },
  coral: { name: "Coral", body: "#FF8A73", shade: "#E5654D", belly: "#FFC7BB" },
  sunshine: { name: "Sunshine", body: "#FFC94D", shade: "#E6A817", belly: "#FFE7A8" },
  mint: { name: "Mint", body: "#6FD39A", shade: "#3FAE70", belly: "#BFF0D3" },
  sky: { name: "Sky", body: "#6AB6FF", shade: "#3C8FE0", belly: "#BFE0FF" },
  berry: { name: "Berry", body: "#D46BB8", shade: "#B04794", belly: "#F2BFE4" },
  slate: { name: "Slate", body: "#8A93A8", shade: "#646D82", belly: "#CBD1DD" },
};

export interface TwinMood {
  expression: Expression;
  message: string;
}

/** Deterministic pick so the message doesn't flicker between renders. */
function pick<T>(list: T[], seed: string): T {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

/**
 * What the Twin says on Today. Rules: never guilt, insult or punish; rest
 * days are good; partial work is acknowledged exactly; pain pauses any
 * competitive framing.
 */
export function twinMood(data: AppData, today: ISODate): TwinMood {
  const name = data.profile?.name ?? "friend";
  const week = weekSummary(data, today, today);
  const day = week.days.find((d) => d.date === today)!;
  const competitive = data.twin.mode === "competitive" && !data.competitionPausedDates.includes(today);
  const gap = daysSinceLastSession(data, today);

  if (data.competitionPausedDates.includes(today)) {
    return {
      expression: "caring",
      message: "No racing today. Look after yourself — I'll be right here when you're ready.",
    };
  }
  if (day.state === "completed") {
    return {
      expression: "excited",
      message: week.goalMet
        ? `That's the whole week's plan done, ${name}! I'm so proud of us.`
        : pick([`We did it! ${day.session?.completedSets} sets in the bag.`, "High five! Today's session is done."], today),
    };
  }
  if (day.state === "partial") {
    const s = day.session!;
    return {
      expression: "happy",
      message: `You did ${s.completedSets} of ${s.plannedSets} sets — that's logged exactly. Every set counts.`,
    };
  }
  if (gap !== null && gap >= RETURN_GAP_DAYS && day.planned) {
    return {
      expression: "excited",
      message: `You're back! I missed training with you, ${name}. Let's ease in together.`,
    };
  }
  if (!day.planned) {
    return {
      expression: "sleepy",
      message: pick(
        [
          "Rest day! I'm stretching and refilling my water bottle. Recovery counts.",
          "Rest day for both of us. Muscles get stronger while we recover.",
          "Feet up today. We'll go again next session.",
        ],
        today,
      ),
    };
  }
  if (competitive) {
    const diff = week.twinCount - week.showedUp;
    if (diff > 0) {
      return {
        expression: "determined",
        message: `I'm on ${week.twinCount} this week, you're on ${week.showedUp}. Fancy catching up today? No pressure — a short one counts.`,
      };
    }
    return {
      expression: "determined",
      message: pick(
        [
          `I'm warming up for ${day.planned.name}. Race you to the last set? 🏁`,
          "Neck and neck this week. Let's see who finishes first today!",
        ],
        today,
      ),
    };
  }
  const yesterday = week.days.find((d) => daysBetween(d.date, today) === 1);
  if (yesterday?.state === "not-done") {
    return { expression: "happy", message: "Today's a fresh start. I'll do it with you." };
  }
  return {
    expression: "happy",
    message: pick(
      [
        `Ready when you are, ${name}. I'll do ${day.planned.name} with you.`,
        "Let's make today count — even a short version does.",
        "I've got my headband on. Shall we?",
      ],
      today,
    ),
  };
}

export function twinName(data: Pick<AppData, "twin">) {
  return twinDisplayName(data);
}
