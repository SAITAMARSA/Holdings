import type { Equipment, Limitation, Pattern } from "./schema";

/**
 * A small curated exercise library for the prototype. Instructions are short,
 * general cues — not medical advice. No video links are included because we
 * have no verified source for them.
 */
export interface Exercise {
  id: string;
  name: string;
  pattern: Pattern;
  /** All items are required. Empty = bodyweight only. */
  equipment: Equipment[];
  /** 1 = beginner friendly, 3 = advanced. */
  level: 1 | 2 | 3;
  /** Whether a load (weight) is meaningful to record. */
  loaded: boolean;
  unit: "reps" | "seconds";
  /** Areas this movement tends to load heavily. Used to filter, not diagnose. */
  stresses: Limitation[];
  summary: string;
  steps: string[];
  /** Plain-language explanation for beginners. */
  why: string;
}

export const PATTERN_LABEL: Record<Pattern, string> = {
  squat: "Squat",
  hinge: "Hip hinge",
  lunge: "Single-leg",
  "push-h": "Push",
  "push-v": "Overhead push",
  "pull-h": "Row",
  "pull-v": "Pull-down",
  core: "Core",
  conditioning: "Cardio",
};

export const PATTERN_PLAIN: Record<Pattern, string> = {
  squat: "legs",
  hinge: "back of the legs and hips",
  lunge: "one leg at a time for balance",
  "push-h": "chest and arms",
  "push-v": "shoulders",
  "pull-h": "upper back",
  "pull-v": "back and arms",
  core: "trunk stability",
  conditioning: "heart and lungs",
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  dumbbells: "Dumbbells",
  kettlebell: "Kettlebell",
  barbell: "Barbell & rack",
  bench: "Bench",
  machines: "Weight machines",
  cable: "Cable station",
  "pullup-bar": "Pull-up bar",
  "resistance-band": "Resistance band",
  "cardio-machine": "Bike or rower",
};

export const ALL_EQUIPMENT = Object.keys(EQUIPMENT_LABEL) as Equipment[];

export const DEFAULT_GYM_EQUIPMENT: Equipment[] = [...ALL_EQUIPMENT];
export const DEFAULT_HOME_EQUIPMENT: Equipment[] = [];

export const EXERCISES: Exercise[] = [
  // ---------------- squat
  {
    id: "sit-to-stand",
    name: "Sit-to-stand",
    pattern: "squat",
    equipment: [],
    level: 1,
    loaded: false,
    unit: "reps",
    stresses: [],
    summary: "Stand up from a chair and sit back down with control.",
    steps: [
      "Sit near the front of a sturdy chair, feet hip-width apart.",
      "Lean forward slightly and press through your whole foot to stand.",
      "Reach your hips back and lower slowly until you touch the seat.",
    ],
    why: "Builds leg strength for everyday movement using a chair as a guide.",
  },
  {
    id: "bodyweight-squat",
    name: "Bodyweight squat",
    pattern: "squat",
    equipment: [],
    level: 2,
    loaded: false,
    unit: "reps",
    stresses: ["knees"],
    summary: "Squat down and stand back up without added weight.",
    steps: [
      "Stand with feet about shoulder-width apart, toes slightly out.",
      "Bend hips and knees together, keeping your chest tall.",
      "Go as low as is comfortable, then push the floor away to stand.",
    ],
    why: "A foundational leg movement you can do anywhere.",
  },
  {
    id: "goblet-squat",
    name: "Goblet squat",
    pattern: "squat",
    equipment: ["dumbbells"],
    level: 2,
    loaded: true,
    unit: "reps",
    stresses: ["knees"],
    summary: "Hold one dumbbell at your chest and squat.",
    steps: [
      "Hold one end of a dumbbell close to your chest with both hands.",
      "Sit down between your knees, elbows inside your thighs.",
      "Keep the weight close and stand by driving through your feet.",
    ],
    why: "The weight in front helps you stay upright while building leg strength.",
  },
  {
    id: "leg-press",
    name: "Leg press",
    pattern: "squat",
    equipment: ["machines"],
    level: 2,
    loaded: true,
    unit: "reps",
    stresses: [],
    summary: "Press a weighted platform away with your legs.",
    steps: [
      "Sit with your back flat on the pad and feet hip-width on the platform.",
      "Release the safety and lower the platform until knees are comfortably bent.",
      "Press back up without locking your knees hard.",
    ],
    why: "A supported way to train your legs with a controllable load.",
  },
  {
    id: "back-squat",
    name: "Barbell back squat",
    pattern: "squat",
    equipment: ["barbell"],
    level: 3,
    loaded: true,
    unit: "reps",
    stresses: ["knees", "lower-back"],
    summary: "Squat with a barbell across your upper back.",
    steps: [
      "Set the safety bars just below your bottom position.",
      "Unrack the bar on your upper back, step back, brace your trunk.",
      "Squat to a depth you control, then drive up keeping the bar over mid-foot.",
    ],
    why: "A classic strength lift that lets you add load in small steps.",
  },
  // ---------------- hinge
  {
    id: "glute-bridge",
    name: "Glute bridge",
    pattern: "hinge",
    equipment: [],
    level: 1,
    loaded: false,
    unit: "reps",
    stresses: [],
    summary: "Lie on your back and lift your hips.",
    steps: [
      "Lie on your back, knees bent, feet flat and hip-width apart.",
      "Squeeze your glutes and lift your hips until your body forms a straight line.",
      "Pause briefly, then lower with control.",
    ],
    why: "Strengthens the hips and back of the legs with very little equipment.",
  },
  {
    id: "single-leg-bridge",
    name: "Single-leg glute bridge",
    pattern: "hinge",
    equipment: [],
    level: 2,
    loaded: false,
    unit: "reps",
    stresses: [],
    summary: "A glute bridge with one foot lifted.",
    steps: [
      "Set up like a glute bridge, then lift one foot off the floor.",
      "Drive through the planted heel to raise your hips level.",
      "Lower slowly. Do all reps on one side, then switch.",
    ],
    why: "A harder bridge that challenges each side separately.",
  },
  {
    id: "db-rdl",
    name: "Dumbbell Romanian deadlift",
    pattern: "hinge",
    equipment: ["dumbbells"],
    level: 2,
    loaded: true,
    unit: "reps",
    stresses: ["lower-back"],
    summary: "Hinge forward at the hips holding dumbbells.",
    steps: [
      "Stand holding dumbbells in front of your thighs, knees softly bent.",
      "Push your hips back and slide the weights down your legs, back flat.",
      "Stop when you feel a stretch in your hamstrings, then stand tall.",
    ],
    why: "Trains the hamstrings and glutes and teaches safe bending.",
  },
  {
    id: "kb-deadlift",
    name: "Kettlebell deadlift",
    pattern: "hinge",
    equipment: ["kettlebell"],
    level: 2,
    loaded: true,
    unit: "reps",
    stresses: ["lower-back"],
    summary: "Lift a kettlebell from the floor by hinging at the hips.",
    steps: [
      "Stand over the kettlebell with it between your feet.",
      "Push your hips back, grip the handle and brace your trunk.",
      "Stand up by driving through your feet; lower it the same way.",
    ],
    why: "A simple way to learn lifting from the floor with good form.",
  },
  {
    id: "barbell-rdl",
    name: "Barbell Romanian deadlift",
    pattern: "hinge",
    equipment: ["barbell"],
    level: 3,
    loaded: true,
    unit: "reps",
    stresses: ["lower-back"],
    summary: "Hinge with a barbell, keeping it close to your legs.",
    steps: [
      "Hold the bar at hip height with a shoulder-width grip.",
      "Push hips back, keeping the bar close and your back flat.",
      "Lower to just below the knees or until hamstrings limit you, then stand.",
    ],
    why: "Builds strong hips and hamstrings with easy small load increases.",
  },
  // ---------------- lunge
  {
    id: "supported-split-squat",
    name: "Supported split squat",
    pattern: "lunge",
    equipment: [],
    level: 1,
    loaded: false,
    unit: "reps",
    stresses: [],
    summary: "A split stance squat holding a wall or chair for balance.",
    steps: [
      "Stand in a long stride with one hand on a wall or chair back.",
      "Lower your back knee towards the floor, only as far as comfortable.",
      "Push up through the front foot. Do all reps, then switch sides.",
    ],
    why: "Builds single-leg strength while the support keeps it steady.",
  },
  {
    id: "split-squat",
    name: "Split squat",
    pattern: "lunge",
    equipment: [],
    level: 2,
    loaded: false,
    unit: "reps",
    stresses: ["knees"],
    summary: "A split stance squat without support.",
    steps: [
      "Take a long stride, back heel lifted.",
      "Drop your back knee straight down towards the floor.",
      "Drive up through the front foot. Switch sides after your reps.",
    ],
    why: "Improves balance and strength one leg at a time.",
  },
  {
    id: "db-reverse-lunge",
    name: "Dumbbell reverse lunge",
    pattern: "lunge",
    equipment: ["dumbbells"],
    level: 2,
    loaded: true,
    unit: "reps",
    stresses: ["knees"],
    summary: "Step back into a lunge holding dumbbells.",
    steps: [
      "Stand tall holding dumbbells at your sides.",
      "Step one foot back and lower both knees with control.",
      "Push through the front foot to return. Alternate legs.",
    ],
    why: "Stepping back is usually easier on the knees than stepping forward.",
  },
  {
    id: "step-up",
    name: "Step-up",
    pattern: "lunge",
    equipment: ["bench"],
    level: 2,
    loaded: false,
    unit: "reps",
    stresses: ["knees"],
    summary: "Step up onto a bench or sturdy box.",
    steps: [
      "Place one foot fully on a stable bench or box.",
      "Press through that foot to stand up on top.",
      "Step down with control. Do all reps, then switch legs.",
    ],
    why: "Practical leg strength for stairs and hills.",
  },
  // ---------------- horizontal push
  {
    id: "incline-push-up",
    name: "Incline push-up",
    pattern: "push-h",
    equipment: [],
    level: 1,
    loaded: false,
    unit: "reps",
    stresses: ["wrists"],
    summary: "A push-up with hands on a wall, counter or sturdy table.",
    steps: [
      "Place hands slightly wider than shoulders on a stable raised surface.",
      "Step back so your body is in a straight line.",
      "Lower your chest towards the surface, then push away.",
    ],
    why: "Makes push-ups achievable — the higher the surface, the easier it is.",
  },
  {
    id: "push-up",
    name: "Push-up",
    pattern: "push-h",
    equipment: [],
    level: 2,
    loaded: false,
    unit: "reps",
    stresses: ["wrists", "shoulders"],
    summary: "The classic floor push-up.",
    steps: [
      "Hands under shoulders, body in a straight line from head to heels.",
      "Lower your chest towards the floor, elbows angled back.",
      "Push the floor away to return.",
    ],
    why: "Builds pressing strength with no equipment.",
  },
  {
    id: "machine-chest-press",
    name: "Machine chest press",
    pattern: "push-h",
    equipment: ["machines"],
    level: 1,
    loaded: true,
    unit: "reps",
    stresses: [],
    summary: "Press handles forward on a seated machine.",
    steps: [
      "Adjust the seat so handles line up with mid-chest.",
      "Press forward until arms are straight but not locked.",
      "Return slowly with control.",
    ],
    why: "A guided path makes it easy to learn pressing safely.",
  },
  {
    id: "db-bench-press",
    name: "Dumbbell bench press",
    pattern: "push-h",
    equipment: ["dumbbells", "bench"],
    level: 2,
    loaded: true,
    unit: "reps",
    stresses: ["shoulders"],
    summary: "Press dumbbells up while lying on a bench.",
    steps: [
      "Lie on a bench, dumbbells at chest level, feet planted.",
      "Press the weights up until arms are straight.",
      "Lower slowly to the sides of your chest.",
    ],
    why: "Trains chest, shoulders and arms with each side working evenly.",
  },
  {
    id: "bench-press",
    name: "Barbell bench press",
    pattern: "push-h",
    equipment: ["barbell", "bench"],
    level: 3,
    loaded: true,
    unit: "reps",
    stresses: ["shoulders"],
    summary: "Press a barbell from your chest while lying on a bench.",
    steps: [
      "Use safety arms or a spotter. Lie with eyes under the bar.",
      "Lower the bar to your mid-chest with control.",
      "Press up and slightly back over your shoulders.",
    ],
    why: "A staple strength lift with easy small load increases.",
  },
  // ---------------- vertical push
  {
    id: "machine-shoulder-press",
    name: "Machine shoulder press",
    pattern: "push-v",
    equipment: ["machines"],
    level: 1,
    loaded: true,
    unit: "reps",
    stresses: ["shoulders"],
    summary: "Press handles overhead on a seated machine.",
    steps: [
      "Adjust the seat so handles start around shoulder height.",
      "Press up until arms are nearly straight.",
      "Lower with control.",
    ],
    why: "A guided way to strengthen your shoulders.",
  },
  {
    id: "band-overhead-press",
    name: "Band overhead press",
    pattern: "push-v",
    equipment: ["resistance-band"],
    level: 1,
    loaded: false,
    unit: "reps",
    stresses: ["shoulders"],
    summary: "Stand on a band and press it overhead.",
    steps: [
      "Stand on the middle of the band, ends at shoulder height.",
      "Press both hands overhead, ribs down.",
      "Lower slowly back to your shoulders.",
    ],
    why: "Light, joint-friendly resistance for overhead strength.",
  },
  {
    id: "db-shoulder-press",
    name: "Dumbbell shoulder press",
    pattern: "push-v",
    equipment: ["dumbbells"],
    level: 2,
    loaded: true,
    unit: "reps",
    stresses: ["shoulders"],
    summary: "Press dumbbells overhead, seated or standing.",
    steps: [
      "Hold dumbbells at shoulder height, palms forward or facing in.",
      "Press up until arms are straight, keeping ribs down.",
      "Lower with control.",
    ],
    why: "Builds shoulder strength and stability.",
  },
  {
    id: "pike-push-up",
    name: "Pike push-up",
    pattern: "push-v",
    equipment: [],
    level: 3,
    loaded: false,
    unit: "reps",
    stresses: ["shoulders", "wrists"],
    summary: "A push-up with hips high to target the shoulders.",
    steps: [
      "Start in a push-up position and walk your feet in, hips high.",
      "Bend your elbows to lower the top of your head towards the floor.",
      "Push back up.",
    ],
    why: "An advanced bodyweight shoulder exercise.",
  },
  {
    id: "wall-slide",
    name: "Wall slide",
    pattern: "push-v",
    equipment: [],
    level: 1,
    loaded: false,
    unit: "reps",
    stresses: [],
    summary: "Slide your arms up a wall with control.",
    steps: [
      "Stand with your back and forearms against a wall.",
      "Slide your arms up as far as comfortable, keeping contact.",
      "Slide back down slowly.",
    ],
    why: "Gentle shoulder movement and posture practice.",
  },
  // ---------------- horizontal pull
  {
    id: "prone-y-raise",
    name: "Prone Y-raise",
    pattern: "pull-h",
    equipment: [],
    level: 1,
    loaded: false,
    unit: "reps",
    stresses: [],
    summary: "Lie face down and lift your arms into a Y.",
    steps: [
      "Lie face down, arms overhead in a Y shape, thumbs up.",
      "Lift your arms a few centimetres by squeezing your shoulder blades.",
      "Hold briefly, then lower.",
    ],
    why: "Strengthens the upper back with no equipment.",
  },
  {
    id: "band-row",
    name: "Band row",
    pattern: "pull-h",
    equipment: ["resistance-band"],
    level: 1,
    loaded: false,
    unit: "reps",
    stresses: [],
    summary: "Pull a resistance band towards your ribs.",
    steps: [
      "Anchor the band at chest height or loop it around your feet while seated.",
      "Pull the handles to your ribs, squeezing your shoulder blades.",
      "Return slowly.",
    ],
    why: "Balances pushing exercises and supports good posture.",
  },
  {
    id: "cable-row",
    name: "Seated cable row",
    pattern: "pull-h",
    equipment: ["cable"],
    level: 1,
    loaded: true,
    unit: "reps",
    stresses: [],
    summary: "Pull a cable handle towards your stomach while seated.",
    steps: [
      "Sit tall with feet on the platform and a slight knee bend.",
      "Pull the handle to your stomach, elbows close.",
      "Let your arms extend slowly without rounding forward.",
    ],
    why: "A steady, controllable way to train the upper back.",
  },
  {
    id: "db-row",
    name: "One-arm dumbbell row",
    pattern: "pull-h",
    equipment: ["dumbbells"],
    level: 2,
    loaded: true,
    unit: "reps",
    stresses: [],
    summary: "Row a dumbbell with one arm while supported.",
    steps: [
      "Support yourself with one hand on a bench or sturdy surface.",
      "Pull the dumbbell up towards your hip.",
      "Lower slowly. Do all reps, then switch sides.",
    ],
    why: "Builds upper-back strength one side at a time.",
  },
  // ---------------- vertical pull
  {
    id: "band-pulldown",
    name: "Band pull-down",
    pattern: "pull-v",
    equipment: ["resistance-band"],
    level: 1,
    loaded: false,
    unit: "reps",
    stresses: [],
    summary: "Pull an overhead-anchored band down to your chest.",
    steps: [
      "Anchor the band high (e.g. over a closed door with a door anchor).",
      "Kneel or sit and pull the band down towards your upper chest.",
      "Return slowly.",
    ],
    why: "Trains the back muscles used for pulling.",
  },
  {
    id: "lat-pulldown",
    name: "Lat pull-down",
    pattern: "pull-v",
    equipment: ["cable"],
    level: 1,
    loaded: true,
    unit: "reps",
    stresses: [],
    summary: "Pull a bar down to your upper chest on a cable machine.",
    steps: [
      "Sit with thighs secured, hands slightly wider than shoulders.",
      "Pull the bar to your upper chest, leading with your elbows.",
      "Let it rise slowly until arms are straight.",
    ],
    why: "Builds the strength that leads towards pull-ups.",
  },
  {
    id: "assisted-pull-up",
    name: "Assisted pull-up",
    pattern: "pull-v",
    equipment: ["machines"],
    level: 2,
    loaded: true,
    unit: "reps",
    stresses: ["shoulders"],
    summary: "A pull-up with a machine taking some of your weight.",
    steps: [
      "Choose an assistance level (more assistance = easier).",
      "Pull your chest up towards the bar.",
      "Lower all the way with control.",
    ],
    why: "A stepping stone to unassisted pull-ups. Record the assistance as load.",
  },
  {
    id: "pull-up",
    name: "Pull-up",
    pattern: "pull-v",
    equipment: ["pullup-bar"],
    level: 3,
    loaded: false,
    unit: "reps",
    stresses: ["shoulders"],
    summary: "Pull yourself up to a bar.",
    steps: [
      "Hang from the bar, hands just wider than shoulders.",
      "Pull until your chin clears the bar.",
      "Lower all the way down with control.",
    ],
    why: "A demanding upper-body strength exercise.",
  },
  // ---------------- core
  {
    id: "dead-bug",
    name: "Dead bug",
    pattern: "core",
    equipment: [],
    level: 1,
    loaded: false,
    unit: "reps",
    stresses: [],
    summary: "Lie on your back and slowly extend opposite arm and leg.",
    steps: [
      "Lie on your back, arms up, knees bent at 90° above your hips.",
      "Press your lower back gently into the floor.",
      "Slowly extend one arm and the opposite leg, return, then switch.",
    ],
    why: "Teaches your trunk to stay steady while your limbs move.",
  },
  {
    id: "forearm-plank",
    name: "Forearm plank",
    pattern: "core",
    equipment: [],
    level: 2,
    loaded: false,
    unit: "seconds",
    stresses: [],
    summary: "Hold a straight body line on your forearms.",
    steps: [
      "Forearms on the floor, elbows under shoulders.",
      "Step back so your body forms a straight line. Knees down is fine.",
      "Breathe steadily and hold.",
    ],
    why: "Builds trunk endurance.",
  },
  {
    id: "side-plank",
    name: "Side plank",
    pattern: "core",
    equipment: [],
    level: 3,
    loaded: false,
    unit: "seconds",
    stresses: ["shoulders"],
    summary: "Hold your body sideways on one forearm.",
    steps: [
      "Lie on your side, elbow under shoulder.",
      "Lift your hips so your body is in a straight line. Bent knees make it easier.",
      "Hold, then switch sides.",
    ],
    why: "Strengthens the sides of your trunk.",
  },
  // ---------------- conditioning
  {
    id: "marching-intervals",
    name: "Marching intervals",
    pattern: "conditioning",
    equipment: [],
    level: 1,
    loaded: false,
    unit: "seconds",
    stresses: [],
    summary: "Brisk marching on the spot or around the room.",
    steps: [
      "March briskly, lifting your knees to a comfortable height.",
      "Swing your arms and keep breathing steadily.",
      "Aim for a pace where you can talk but not sing.",
    ],
    why: "Raises your heart rate gently with no impact.",
  },
  {
    id: "bike-intervals",
    name: "Bike or rower intervals",
    pattern: "conditioning",
    equipment: ["cardio-machine"],
    level: 1,
    loaded: false,
    unit: "seconds",
    stresses: [],
    summary: "Short efforts on a bike or rowing machine.",
    steps: [
      "Warm up easy for a minute.",
      "Work at a strong but sustainable effort for each interval.",
      "Slow right down during rests.",
    ],
    why: "Improves fitness with low impact on joints.",
  },
  {
    id: "jumping-jacks",
    name: "Jumping jacks",
    pattern: "conditioning",
    equipment: [],
    level: 2,
    loaded: false,
    unit: "seconds",
    stresses: ["knees"],
    summary: "Classic jumping jacks.",
    steps: [
      "Jump your feet out while raising your arms overhead.",
      "Jump back to the start.",
      "Step side-to-side instead to remove the jump.",
    ],
    why: "Quick, equipment-free cardio.",
  },
  {
    id: "kb-swing",
    name: "Kettlebell swing",
    pattern: "conditioning",
    equipment: ["kettlebell"],
    level: 3,
    loaded: true,
    unit: "reps",
    stresses: ["lower-back"],
    summary: "Swing a kettlebell to chest height using a hip snap.",
    steps: [
      "Hike the kettlebell back between your legs, hips back.",
      "Snap your hips forward to float it to chest height.",
      "Let it swing back and repeat. Arms guide — hips power it.",
    ],
    why: "Powerful hip training that raises your heart rate.",
  },
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

/** Safe lookup used by the UI — unknown ids (e.g. from old data) get a stub. */
export function exerciseOrStub(id: string): Exercise {
  return (
    BY_ID.get(id) ?? {
      id,
      name: "Unknown exercise",
      pattern: "core",
      equipment: [],
      level: 1,
      loaded: false,
      unit: "reps",
      stresses: [],
      summary: "This exercise is no longer in the library.",
      steps: [],
      why: "",
    }
  );
}

export function isAvailable(ex: Exercise, equipment: readonly Equipment[]): boolean {
  return ex.equipment.every((e) => equipment.includes(e));
}

export function isSuitable(ex: Exercise, limitations: readonly Limitation[]): boolean {
  return !ex.stresses.some((s) => limitations.includes(s));
}

export interface PickOptions {
  pattern: Pattern;
  equipment: readonly Equipment[];
  limitations: readonly Limitation[];
  targetLevel: number;
  exclude?: readonly string[];
  prefer?: readonly string[];
}

/**
 * Deterministically choose the best exercise for a movement slot: the closest
 * level at or below the target, falling back to the nearest harder option.
 * Library order breaks ties so plans stay stable between regenerations.
 */
export function pickExercise(opts: PickOptions): Exercise | undefined {
  const candidates = EXERCISES.filter(
    (e) =>
      e.pattern === opts.pattern &&
      isAvailable(e, opts.equipment) &&
      isSuitable(e, opts.limitations) &&
      !(opts.exclude ?? []).includes(e.id),
  );
  if (candidates.length === 0) return undefined;
  const preferred = candidates.find((e) => (opts.prefer ?? []).includes(e.id));
  if (preferred) return preferred;
  const atOrBelow = candidates.filter((e) => e.level <= opts.targetLevel);
  if (atOrBelow.length) {
    const best = Math.max(...atOrBelow.map((e) => e.level));
    // Prefer loaded options when equal level, so gym users get progressable lifts.
    const tier = atOrBelow.filter((e) => e.level === best);
    return tier.find((e) => e.loaded) ?? tier[0];
  }
  const lowest = Math.min(...candidates.map((e) => e.level));
  return candidates.find((e) => e.level === lowest);
}

/** Alternatives for the same movement, for "replace exercise". */
export function alternativesFor(
  exerciseId: string,
  equipment: readonly Equipment[],
  limitations: readonly Limitation[],
): Exercise[] {
  const ex = getExercise(exerciseId);
  if (!ex) return [];
  return EXERCISES.filter(
    (e) =>
      e.id !== ex.id &&
      e.pattern === ex.pattern &&
      isAvailable(e, equipment) &&
      isSuitable(e, limitations),
  ).sort((a, b) => a.level - b.level);
}

/** An easier exercise for the same movement, if one is available. */
export function easierVariant(
  exerciseId: string,
  equipment: readonly Equipment[],
  limitations: readonly Limitation[],
): Exercise | undefined {
  const ex = getExercise(exerciseId);
  if (!ex) return undefined;
  return alternativesFor(exerciseId, equipment, limitations)
    .filter((e) => e.level < ex.level)
    .sort((a, b) => b.level - a.level)[0];
}
