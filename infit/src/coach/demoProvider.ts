import type { CoachAction } from "@/domain/schema";
import type { CoachProvider, CoachReply, CoachRequest } from "./types";

/**
 * Deterministic, scripted coach used when no live model is configured.
 * It recognises a fixed set of intents with keyword rules and builds replies
 * from the user's actual plan. Replies are labelled "demo" in the UI.
 */

const PAIN =
  /\b(pain|painful|hurts?|hurting|injur\w*|sprain\w*|strain(ed)?|sharp|swollen|swelling|pulled|tweaked|chest pain|dizz\w*|faint\w*|numb\w*)\b/i;
const URGENT = /\b(chest pain|can'?t breathe|trouble breathing|faint\w*|passed out)\b/i;
const MEDICAL = /\b(diagnos\w*|is it (torn|broken)|should i (ice|take)|medication|physio(therapy)?|treat(ment)?)\b/i;
const SENSITIVE =
  /\b(pregnan\w*|medication|diabet\w*|heart condition|depress\w*|anxiety|eating disorder|bulimi\w*|anorexi\w*|surgery|cancer|blood pressure)\b/i;

const rx = {
  explain: /\b(explain|why|what('?s| is) (today|this)|today'?s (workout|session)|how do i do)\b/i,
  week: /\b(week|schedule|days?|busy|travel\w*|holiday|vacation|move (my|the) (session|workout))\b/i,
  replace: /\b(replace|swap|substitut\w*|instead of|don'?t like|alternative)\b/i,
  meals: /\b(meal|meals|food|eat|eating|recipe|budget|hungry|nutrition|protein|cook|shopping)\b/i,
  returning: /\b(break|been away|returning|coming back|come back|haven'?t (trained|been)|time off|restart)\b/i,
  lessTime: /\b(short on time|no time|only (have|got) \d+|\d+ ?min(ute)?s?|quick(er)? (one|session|workout)|in a hurry)\b/i,
  equipment: /\b(equipment|machine|dumbbells?|barbell|rack|at home|different gym|hotel|kettlebell)\b/i,
  tooHard: /\b(too hard|too difficult|struggl\w*|exhausted|can'?t (do|finish|manage))\b/i,
  motivation: /\b(tired|no motivation|unmotivated|don'?t feel like|lazy|can'?t be bothered|low energy)\b/i,
  remember: /^(please )?(remember|note|keep in mind)( that)?\s+(.+)/i,
  greeting: /^(hi|hey|hello|yo|morning|evening|good (morning|afternoon|evening))\b/i,
};

function reply(text: string, actions: CoachAction[] = [], safety = false): CoachReply {
  return { text, actions, source: "demo", safety };
}

function explainToday(req: CoachRequest): CoachReply {
  const { today, displayDetail, experience } = req.context;
  if (today.rest || !today.session) {
    return reply(
      "Today is a planned rest day. Rest is when your body adapts to training, so it's part of the plan — not a gap in it. A walk or some light stretching is a nice extra if you feel like it.",
      [{ type: "open-adjust", reason: "schedule-changed", label: "Train today instead" }],
    );
  }
  const s = today.session;
  const lines = s.exercises.map((e) => {
    const amount =
      e.unit === "seconds" ? `${e.min}–${e.max} seconds` : e.min === e.max ? `${e.max} reps` : `${e.min}–${e.max} reps`;
    if (displayDetail === "detailed") {
      return `• ${e.name}: ${e.sets} × ${amount}, rest ${e.restSec}s`;
    }
    return `• ${e.name} — ${e.sets} round${e.sets > 1 ? "s" : ""} of ${amount}. ${e.why}`;
  });
  const effort =
    experience === "new"
      ? "Aim to finish each set feeling like you could have done 2–3 more with good form. If something feels wrong, stop and swap it."
      : "Leave 1–3 reps in reserve on most sets. Log loads so I can suggest sensible progressions.";
  return reply(
    `${s.name} (about ${s.estMinutes} min${s.adjusted ? ", adjusted for today" : ""}). ${s.purpose}\n\n${lines.join("\n")}\n\n${effort}`,
    [
      { type: "navigate", href: "/workout", label: "Start workout" },
      { type: "open-adjust", reason: "less-time", label: "Make it shorter" },
    ],
  );
}

export function demoReply(req: CoachRequest): CoachReply {
  const msg = req.message.trim();
  const qa = req.quickAction;
  const name = req.context.name || "there";

  // Safety first: pain/injury interrupts everything else.
  if (URGENT.test(msg)) {
    return reply(
      "Please stop exercising now. Chest pain, trouble breathing or fainting can be serious — contact emergency services or seek urgent medical help. Infit can't assess symptoms.",
      [],
      true,
    );
  }
  if (PAIN.test(msg)) {
    return reply(
      "Thanks for telling me. Pain is a signal to stop, not something to push through. Stop the exercise that hurts. If the pain is sharp, severe or doesn't settle, please speak to a qualified health professional — I can't diagnose or treat injuries.\n\nIf you'd like, we can turn today into a rest day. Your Twin will pause any competition and nothing counts as missed.",
      [{ type: "open-adjust", reason: "too-difficult", label: "Rest today" }],
      true,
    );
  }
  if (MEDICAL.test(msg)) {
    return reply(
      "I can't diagnose conditions or recommend treatment. A doctor or physiotherapist is the right person for that. What I can do is adjust your workouts — for example making them gentler or swapping exercises.",
      [{ type: "open-adjust", reason: "too-difficult", label: "Make today gentler" }],
      true,
    );
  }

  const remember = rx.remember.exec(msg);
  if (remember) {
    if (SENSITIVE.test(msg)) {
      return reply(
        "I'd rather not store health details in this prototype. If something affects how you train, you can note general limitations (like knees or shoulders) in your profile, and a professional can give you specific advice.",
        [{ type: "navigate", href: "/settings", label: "Open profile" }],
      );
    }
    const text = remember[4].replace(/[.!]+$/, "").slice(0, 180);
    const cleaned = text.charAt(0).toUpperCase() + text.slice(1);
    const category = rx.meals.test(text)
      ? "food"
      : rx.equipment.test(text)
        ? "equipment"
        : rx.week.test(text)
          ? "schedule"
          : "other";
    return reply(
      `Want me to remember: "${cleaned}"? I'll only save it if you confirm, and you can edit or delete it anytime in What your coach knows.`,
      [{ type: "propose-memory", text: cleaned, category, label: "Save to coach memory" }],
    );
  }

  if (qa === "explain-today" || (!qa && rx.explain.test(msg))) return explainToday(req);

  if (qa === "returning" || (!qa && rx.returning.test(msg))) {
    const gap = req.context.daysSinceLastSession;
    return reply(
      `Welcome back, ${name}! ${gap !== null && gap > 0 ? `It's been ${gap} day${gap > 1 ? "s" : ""}. ` : ""}Coming back is the hardest step and you've just taken it. I suggest an easier first session: lighter variations, fewer sets and comfortable rests. You can also ease in for a whole week. Your old achievements stay — you can start a fresh baseline for progress if you like.`,
      [{ type: "open-adjust", reason: "returning", label: "Ease me back in" }],
    );
  }

  if (qa === "replace-exercise" || (!qa && rx.replace.test(msg))) {
    if (req.context.today.rest || !req.context.today.session) {
      return reply(
        "Today is a rest day, so there's nothing to swap right now. During a workout you can tap “Replace” on any exercise, or ask me again on a training day.",
      );
    }
    return reply(
      `Sure. I'll show you alternatives that train the same movement and fit your equipment${
        req.context.memory.length ? " and what you've told me" : ""
      }. You'll see the change before anything is saved, and you can choose whether it's just for today.`,
      [{ type: "open-adjust", reason: "swap-exercise", label: "Choose an exercise to replace" }],
    );
  }

  if (qa === "meals" || (!qa && rx.meals.test(msg))) {
    if (!req.context.mealsSetUp) {
      return reply(
        "Happy to help! I'll suggest simple meals that fit your budget, diet and cooking time. First, a few quick questions — about a minute. Cost and nutrition figures are rough estimates, not live prices or verified values.",
        [{ type: "navigate", href: "/meals/preferences", label: "Set meal preferences" }],
      );
    }
    return reply(
      "Here are this week's ideas based on your preferences. Save the ones you like and I'll combine them into a shopping list. Costs are rough estimates — check prices and allergen labels in store.",
      [{ type: "navigate", href: "/meals", label: "See meal ideas" }],
    );
  }

  if (qa === "adjust-week" || (!qa && rx.week.test(msg))) {
    return reply(
      "Let's make the week fit your life. I can move today's session to another day, make today a rest day, bring your next session forward, or change your regular training days. You'll preview every change before it's applied.",
      [
        { type: "open-adjust", reason: "schedule-changed", label: "Change my schedule" },
        { type: "open-adjust", reason: "less-time", label: "Shorter sessions" },
      ],
    );
  }

  if (rx.lessTime.test(msg)) {
    return reply("No problem — a shorter session still counts. I'll keep the main movements and trim the extras.", [
      { type: "open-adjust", reason: "less-time", label: "Shorten today" },
    ]);
  }
  if (rx.equipment.test(msg)) {
    return reply("I can rebuild today around the equipment you have, keeping the same movements wherever possible.", [
      { type: "open-adjust", reason: "equipment-unavailable", label: "Equipment unavailable" },
      { type: "open-adjust", reason: "at-home", label: "Training at home" },
      { type: "open-adjust", reason: "different-gym", label: "Different gym" },
    ]);
  }
  if (rx.tooHard.test(msg)) {
    return reply(
      "Thanks for being honest — that's useful. We can use easier variations with fewer sets today, and you decide whether to keep it that way.",
      [{ type: "open-adjust", reason: "too-difficult", label: "Make it easier" }],
    );
  }
  if (rx.motivation.test(msg)) {
    return reply(
      "Some days are like that. A short session still keeps the habit going — or a rest day is fine too. No guilt either way.",
      [
        { type: "open-adjust", reason: "less-time", label: "Do a short version" },
        { type: "open-adjust", reason: "schedule-changed", label: "Rest today" },
      ],
    );
  }
  if (rx.greeting.test(msg)) {
    return reply(
      `Hi ${name}! I can explain today's workout, adjust your week, swap exercises, help with meals or ease you back after a break. What would help?`,
    );
  }
  return reply(
    "I'm the demo coach, so I can only handle a set of common requests. Try one of these: explain today's workout, adjust my week, replace an exercise, help with meals, or “remember that …” to save a preference.",
  );
}

export const demoProvider: CoachProvider = {
  id: "demo",
  async reply(req) {
    return demoReply(req);
  },
};
