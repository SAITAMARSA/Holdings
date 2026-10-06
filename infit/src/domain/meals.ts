import type { Allergen, Currency, Diet, MealPreferences } from "./schema";

/**
 * Curated meal ideas with ROUGH cost and nutrition estimates. Costs are
 * typical supermarket figures converted with fixed multipliers — they are not
 * live store prices. Nutrition values are approximate and unverified.
 */

type Tag = "meat" | "fish" | "shellfish" | "dairy" | "egg";

interface Ingredient {
  id: string;
  name: string;
  category: "Produce" | "Protein" | "Dairy & eggs" | "Grains & bread" | "Tins & jars" | "Frozen" | "Condiments";
  unit: string;
  /** Rough reference cost per unit (USD). */
  costPerUnit: number;
  tags: Tag[];
  allergens: Allergen[];
}

const I = (
  id: string,
  name: string,
  category: Ingredient["category"],
  unit: string,
  costPerUnit: number,
  tags: Tag[] = [],
  allergens: Allergen[] = [],
): Ingredient => ({ id, name, category, unit, costPerUnit, tags, allergens });

export const INGREDIENTS: Record<string, Ingredient> = Object.fromEntries(
  [
    I("chickpeas", "Chickpeas (tinned)", "Tins & jars", "g", 0.004),
    I("chopped-tomatoes", "Chopped tomatoes (tinned)", "Tins & jars", "g", 0.003),
    I("spinach", "Spinach", "Produce", "g", 0.012),
    I("onion", "Onion", "Produce", "pcs", 0.35),
    I("curry-paste", "Curry paste", "Condiments", "tbsp", 0.3),
    I("rice", "Rice", "Grains & bread", "g", 0.003),
    I("chicken-thigh", "Chicken thighs", "Protein", "g", 0.011, ["meat"]),
    I("chicken-breast", "Chicken breast", "Protein", "g", 0.013, ["meat"]),
    I("turkey-mince", "Turkey mince", "Protein", "g", 0.012, ["meat"]),
    I("mixed-veg", "Stir-fry vegetables", "Produce", "g", 0.008),
    I("soy-sauce", "Soy sauce", "Condiments", "tbsp", 0.1, [], ["soy", "gluten"]),
    I("coconut-aminos", "Coconut aminos", "Condiments", "tbsp", 0.25),
    I("oats", "Oats", "Grains & bread", "g", 0.003, [], ["gluten"]),
    I("gf-oats", "Gluten-free oats", "Grains & bread", "g", 0.006),
    I("greek-yogurt", "Greek yogurt", "Dairy & eggs", "g", 0.006, ["dairy"], ["dairy"]),
    I("soy-yogurt", "Soy yogurt", "Dairy & eggs", "g", 0.007, [], ["soy"]),
    I("coconut-yogurt", "Coconut yogurt", "Dairy & eggs", "g", 0.009),
    I("frozen-berries", "Frozen berries", "Frozen", "g", 0.008),
    I("pasta", "Pasta", "Grains & bread", "g", 0.003, [], ["gluten"]),
    I("gf-pasta", "Gluten-free pasta", "Grains & bread", "g", 0.006),
    I("tuna", "Tuna (tinned)", "Tins & jars", "can", 1.4, ["fish"], ["fish"]),
    I("cannellini", "Cannellini beans (tinned)", "Tins & jars", "g", 0.004),
    I("cherry-tomatoes", "Cherry tomatoes", "Produce", "g", 0.01),
    I("olive-oil", "Olive oil", "Condiments", "tbsp", 0.12),
    I("red-lentils", "Red lentils", "Grains & bread", "g", 0.004),
    I("carrot", "Carrot", "Produce", "pcs", 0.2),
    I("eggs", "Eggs", "Dairy & eggs", "pcs", 0.3, ["egg"], ["eggs"]),
    I("frozen-peas", "Frozen peas", "Frozen", "g", 0.004),
    I("spring-onion", "Spring onions", "Produce", "pcs", 0.15),
    I("salmon", "Salmon fillet", "Protein", "pcs", 3.0, ["fish"], ["fish"]),
    I("potatoes", "Potatoes", "Produce", "g", 0.002),
    I("green-beans", "Green beans", "Produce", "g", 0.008),
    I("tortillas", "Flour tortillas", "Grains & bread", "pcs", 0.3, [], ["gluten"]),
    I("corn-tortillas", "Corn tortillas", "Grains & bread", "pcs", 0.3),
    I("black-beans", "Black beans (tinned)", "Tins & jars", "g", 0.004),
    I("cheese", "Cheddar cheese", "Dairy & eggs", "g", 0.012, ["dairy"], ["dairy"]),
    I("vegan-cheese", "Dairy-free cheese", "Dairy & eggs", "g", 0.018),
    I("salsa", "Salsa", "Condiments", "tbsp", 0.15),
    I("noodles", "Wheat noodles", "Grains & bread", "g", 0.005, [], ["gluten"]),
    I("rice-noodles", "Rice noodles", "Grains & bread", "g", 0.006),
    I("peanut-butter", "Peanut butter", "Condiments", "tbsp", 0.15, [], ["peanuts"]),
    I("sunflower-butter", "Sunflower seed butter", "Condiments", "tbsp", 0.3),
    I("tofu", "Firm tofu", "Protein", "g", 0.008, [], ["soy"]),
    I("cabbage", "Cabbage", "Produce", "g", 0.003),
    I("kidney-beans", "Kidney beans (tinned)", "Tins & jars", "g", 0.004),
    I("lettuce", "Lettuce", "Produce", "g", 0.008),
    I("cucumber", "Cucumber", "Produce", "pcs", 0.4),
    I("peppers", "Peppers", "Produce", "pcs", 0.7),
    I("bread", "Wholemeal bread", "Grains & bread", "slices", 0.15, [], ["gluten"]),
    I("gf-bread", "Gluten-free bread", "Grains & bread", "slices", 0.35),
    I("courgette", "Courgette", "Produce", "pcs", 0.6),
    I("couscous", "Couscous", "Grains & bread", "g", 0.004, [], ["gluten"]),
    I("quinoa", "Quinoa", "Grains & bread", "g", 0.009),
  ].map((i) => [i.id, i]),
);

/** Substitutions tried in order when an ingredient conflicts with preferences. */
export const SUBSTITUTIONS: Record<string, string[]> = {
  "chicken-thigh": ["tofu", "chickpeas"],
  "chicken-breast": ["tofu", "chickpeas"],
  "turkey-mince": ["red-lentils", "kidney-beans"],
  tuna: ["chickpeas"],
  salmon: ["tofu", "chickpeas"],
  "greek-yogurt": ["soy-yogurt", "coconut-yogurt"],
  cheese: ["vegan-cheese"],
  eggs: ["tofu"],
  pasta: ["gf-pasta"],
  tortillas: ["corn-tortillas"],
  bread: ["gf-bread"],
  "soy-sauce": ["coconut-aminos"],
  noodles: ["rice-noodles"],
  "peanut-butter": ["sunflower-butter"],
  couscous: ["quinoa"],
  oats: ["gf-oats"],
  tofu: ["chickpeas"],
  "soy-yogurt": ["coconut-yogurt"],
};

interface MealIngredient {
  id: string;
  qty: number;
}

export interface Meal {
  id: string;
  name: string;
  minutes: number;
  type: "breakfast" | "main";
  ingredients: MealIngredient[];
  steps: string[];
  /** Approximate per-serving values. Unverified estimates. */
  kcal: number;
  proteinG: number;
}

export const MEALS: Meal[] = [
  {
    id: "chickpea-curry",
    name: "Chickpea & spinach curry",
    minutes: 25,
    type: "main",
    ingredients: [
      { id: "chickpeas", qty: 120 },
      { id: "chopped-tomatoes", qty: 200 },
      { id: "spinach", qty: 60 },
      { id: "onion", qty: 0.5 },
      { id: "curry-paste", qty: 1 },
      { id: "rice", qty: 75 },
    ],
    steps: [
      "Soften the onion, stir in curry paste.",
      "Add tomatoes and chickpeas; simmer 15 min.",
      "Stir in spinach; serve with rice.",
    ],
    kcal: 520,
    proteinG: 18,
  },
  {
    id: "chicken-stir-fry",
    name: "Chicken & veg stir-fry",
    minutes: 20,
    type: "main",
    ingredients: [
      { id: "chicken-thigh", qty: 150 },
      { id: "mixed-veg", qty: 150 },
      { id: "soy-sauce", qty: 1 },
      { id: "rice", qty: 75 },
    ],
    steps: ["Cook rice.", "Stir-fry sliced chicken until cooked through.", "Add veg and soy sauce; toss for 3–4 min."],
    kcal: 600,
    proteinG: 40,
  },
  {
    id: "overnight-oats",
    name: "Overnight oats with berries",
    minutes: 5,
    type: "breakfast",
    ingredients: [
      { id: "oats", qty: 50 },
      { id: "greek-yogurt", qty: 150 },
      { id: "frozen-berries", qty: 80 },
    ],
    steps: ["Mix oats and yogurt with a splash of water.", "Top with berries.", "Chill overnight."],
    kcal: 380,
    proteinG: 20,
  },
  {
    id: "tuna-pasta-salad",
    name: "Tuna & bean pasta salad",
    minutes: 15,
    type: "main",
    ingredients: [
      { id: "pasta", qty: 80 },
      { id: "tuna", qty: 1 },
      { id: "cannellini", qty: 100 },
      { id: "cherry-tomatoes", qty: 80 },
      { id: "olive-oil", qty: 1 },
    ],
    steps: ["Cook pasta and cool under cold water.", "Mix with tuna, beans and halved tomatoes.", "Dress with olive oil."],
    kcal: 560,
    proteinG: 38,
  },
  {
    id: "lentil-bolognese",
    name: "Lentil bolognese",
    minutes: 30,
    type: "main",
    ingredients: [
      { id: "red-lentils", qty: 70 },
      { id: "chopped-tomatoes", qty: 200 },
      { id: "carrot", qty: 1 },
      { id: "onion", qty: 0.5 },
      { id: "pasta", qty: 80 },
    ],
    steps: ["Soften diced onion and carrot.", "Add lentils, tomatoes and a cup of water; simmer 20 min.", "Serve over pasta."],
    kcal: 580,
    proteinG: 26,
  },
  {
    id: "egg-fried-rice",
    name: "Egg fried rice with peas",
    minutes: 15,
    type: "main",
    ingredients: [
      { id: "rice", qty: 75 },
      { id: "eggs", qty: 2 },
      { id: "frozen-peas", qty: 80 },
      { id: "soy-sauce", qty: 1 },
      { id: "spring-onion", qty: 2 },
    ],
    steps: [
      "Use cooked, cooled rice.",
      "Scramble eggs in a hot pan, add rice and peas.",
      "Season with soy sauce and spring onion.",
    ],
    kcal: 520,
    proteinG: 22,
  },
  {
    id: "salmon-tray",
    name: "Baked salmon, potatoes & greens",
    minutes: 35,
    type: "main",
    ingredients: [
      { id: "salmon", qty: 1 },
      { id: "potatoes", qty: 200 },
      { id: "green-beans", qty: 100 },
      { id: "olive-oil", qty: 1 },
    ],
    steps: ["Roast cubed potatoes 20 min.", "Add salmon and beans to the tray.", "Roast 12–15 min more until cooked through."],
    kcal: 560,
    proteinG: 35,
  },
  {
    id: "bean-quesadillas",
    name: "Black bean quesadillas",
    minutes: 15,
    type: "main",
    ingredients: [
      { id: "tortillas", qty: 2 },
      { id: "black-beans", qty: 100 },
      { id: "cheese", qty: 40 },
      { id: "salsa", qty: 2 },
    ],
    steps: ["Mash beans with salsa.", "Fill tortillas with beans and cheese.", "Toast in a dry pan until golden."],
    kcal: 620,
    proteinG: 26,
  },
  {
    id: "peanut-noodles",
    name: "Peanut tofu noodle bowl",
    minutes: 20,
    type: "main",
    ingredients: [
      { id: "noodles", qty: 80 },
      { id: "peanut-butter", qty: 1.5 },
      { id: "tofu", qty: 100 },
      { id: "cabbage", qty: 100 },
      { id: "soy-sauce", qty: 1 },
    ],
    steps: [
      "Cook noodles.",
      "Pan-fry cubed tofu.",
      "Whisk peanut butter with soy sauce and hot water; toss everything with shredded cabbage.",
    ],
    kcal: 640,
    proteinG: 28,
  },
  {
    id: "turkey-chilli",
    name: "Turkey & bean chilli",
    minutes: 40,
    type: "main",
    ingredients: [
      { id: "turkey-mince", qty: 125 },
      { id: "kidney-beans", qty: 100 },
      { id: "chopped-tomatoes", qty: 200 },
      { id: "onion", qty: 0.5 },
      { id: "rice", qty: 75 },
    ],
    steps: ["Brown mince with onion.", "Add beans, tomatoes and spices; simmer 25 min.", "Serve with rice."],
    kcal: 580,
    proteinG: 42,
  },
  {
    id: "chicken-wraps",
    name: "Chicken & yogurt wraps",
    minutes: 15,
    type: "main",
    ingredients: [
      { id: "chicken-breast", qty: 120 },
      { id: "tortillas", qty: 2 },
      { id: "greek-yogurt", qty: 50 },
      { id: "lettuce", qty: 40 },
      { id: "cucumber", qty: 0.25 },
    ],
    steps: ["Cook and slice chicken.", "Spread yogurt on wraps.", "Fill with chicken, lettuce and cucumber."],
    kcal: 500,
    proteinG: 42,
  },
  {
    id: "veggie-omelette",
    name: "Veggie omelette & toast",
    minutes: 10,
    type: "breakfast",
    ingredients: [
      { id: "eggs", qty: 3 },
      { id: "peppers", qty: 0.5 },
      { id: "spinach", qty: 30 },
      { id: "bread", qty: 2 },
    ],
    steps: ["Soften sliced pepper and spinach.", "Pour in beaten eggs and cook gently.", "Serve with toast."],
    kcal: 450,
    proteinG: 25,
  },
  {
    id: "tofu-traybake",
    name: "Tofu & veg tray bake with couscous",
    minutes: 40,
    type: "main",
    ingredients: [
      { id: "tofu", qty: 150 },
      { id: "peppers", qty: 0.5 },
      { id: "courgette", qty: 0.5 },
      { id: "couscous", qty: 70 },
      { id: "olive-oil", qty: 1 },
    ],
    steps: ["Toss tofu and chopped veg in oil.", "Roast 30 min, turning once.", "Serve with couscous."],
    kcal: 520,
    proteinG: 24,
  },
];

// ---------------------------------------------------------------- currency

/** Fixed, approximate multipliers from the USD reference prices. Not live rates. */
export const CURRENCY: Record<Currency, { symbol: string; rate: number; label: string }> = {
  GBP: { symbol: "£", rate: 0.8, label: "British pound" },
  USD: { symbol: "$", rate: 1, label: "US dollar" },
  EUR: { symbol: "€", rate: 0.92, label: "Euro" },
  AUD: { symbol: "A$", rate: 1.5, label: "Australian dollar" },
  CAD: { symbol: "C$", rate: 1.36, label: "Canadian dollar" },
};

export function formatMoney(amountUsd: number, currency: Currency): string {
  const c = CURRENCY[currency];
  return `${c.symbol}${(amountUsd * c.rate).toFixed(2)}`;
}

// ---------------------------------------------------------------- adaptation

function conflicts(ing: Ingredient, diet: Diet, allergies: readonly Allergen[]): boolean {
  if (ing.allergens.some((a) => allergies.includes(a))) return true;
  if (diet === "vegan") return ing.tags.length > 0;
  if (diet === "vegetarian") return ing.tags.some((t) => t === "meat" || t === "fish" || t === "shellfish");
  if (diet === "pescatarian") return ing.tags.includes("meat");
  return false;
}

export interface AdaptedIngredient {
  id: string;
  name: string;
  qty: number;
  unit: string;
  costUsd: number;
  category: Ingredient["category"];
  substitutedFrom?: string;
  inPantry: boolean;
}

export interface AdaptedMeal {
  meal: Meal;
  ingredients: AdaptedIngredient[];
  substitutions: { from: string; to: string }[];
  /** Estimated cost per serving, excluding pantry items (USD reference). */
  costPerServingUsd: number;
  fitsBudget: boolean | null;
  pantryMatches: number;
}

function inPantry(name: string, id: string, pantry: readonly string[]): boolean {
  const n = name.toLowerCase();
  return pantry.some((p) => {
    const q = p.trim().toLowerCase();
    return q.length > 1 && (n.includes(q) || id.includes(q.replace(/\s+/g, "-")));
  });
}

/** Budget per serving: weekly budget ÷ people ÷ ~14 main meals. */
export function servingBudgetUsd(prefs: MealPreferences): number {
  return prefs.weeklyBudget / CURRENCY[prefs.currency].rate / prefs.people / 14;
}

export function adaptMeal(meal: Meal, prefs: MealPreferences | null): AdaptedMeal | null {
  const diet = prefs?.diet ?? "none";
  const allergies = prefs?.allergies ?? [];
  const pantry = prefs?.pantry ?? [];
  const ingredients: AdaptedIngredient[] = [];
  const substitutions: AdaptedMeal["substitutions"] = [];
  for (const mi of meal.ingredients) {
    let ing = INGREDIENTS[mi.id];
    let from: string | undefined;
    if (!ing) return null;
    if (conflicts(ing, diet, allergies)) {
      const sub = (SUBSTITUTIONS[ing.id] ?? []).map((id) => INGREDIENTS[id]).find((s) => s && !conflicts(s, diet, allergies));
      if (!sub) return null; // can't make this meal safely
      from = ing.name;
      substitutions.push({ from: ing.name, to: sub.name });
      ing = sub;
    }
    const pantryHit = inPantry(ing.name, ing.id, pantry);
    ingredients.push({
      id: ing.id,
      name: ing.name,
      qty: mi.qty,
      unit: ing.unit,
      costUsd: mi.qty * ing.costPerUnit,
      category: ing.category,
      substitutedFrom: from,
      inPantry: pantryHit,
    });
  }
  const costPerServingUsd = ingredients.filter((i) => !i.inPantry).reduce((n, i) => n + i.costUsd, 0);
  return {
    meal,
    ingredients,
    substitutions,
    costPerServingUsd,
    fitsBudget: prefs ? costPerServingUsd <= servingBudgetUsd(prefs) : null,
    pantryMatches: ingredients.filter((i) => i.inPantry).length,
  };
}

const TIME_LIMIT: Record<MealPreferences["cookingTime"], number> = { quick: 15, medium: 30, relaxed: 90 };

/** Suggestions that respect diet, allergies and cooking time, best fit first. */
export function suggestMeals(prefs: MealPreferences | null): AdaptedMeal[] {
  const limit = prefs ? TIME_LIMIT[prefs.cookingTime] : 90;
  return MEALS.filter((m) => m.minutes <= limit)
    .map((m) => adaptMeal(m, prefs))
    .filter((m): m is AdaptedMeal => m !== null)
    .sort(
      (a, b) =>
        Number(b.fitsBudget) - Number(a.fitsBudget) ||
        b.pantryMatches - a.pantryMatches ||
        a.costPerServingUsd - b.costPerServingUsd,
    );
}

export function mealOfTheDay(prefs: MealPreferences | null, dateSeed: string): AdaptedMeal | null {
  const list = suggestMeals(prefs).filter((m) => m.meal.type === "main");
  if (list.length === 0) return null;
  const n = dateSeed.split("-").reduce((a, b) => a + Number(b), 0);
  // Rotate among the best few so it stays relevant but not repetitive.
  const pool = list.slice(0, Math.min(4, list.length));
  return pool[n % pool.length];
}

export interface ShoppingItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  costUsd: number;
  category: Ingredient["category"];
  inPantry: boolean;
}

export function shoppingList(mealIds: readonly string[], prefs: MealPreferences | null) {
  const people = prefs?.people ?? 1;
  const items = new Map<string, ShoppingItem>();
  const meals: AdaptedMeal[] = [];
  for (const id of mealIds) {
    const meal = MEALS.find((m) => m.id === id);
    const adapted = meal ? adaptMeal(meal, prefs) : null;
    if (!adapted) continue; // no longer compatible with current preferences
    meals.push(adapted);
    for (const ing of adapted.ingredients) {
      const prev = items.get(ing.id);
      const qty = ing.qty * people;
      items.set(ing.id, {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        category: ing.category,
        inPantry: ing.inPantry,
        qty: (prev?.qty ?? 0) + qty,
        costUsd: (prev?.costUsd ?? 0) + ing.costUsd * people,
      });
    }
  }
  const list = [...items.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const totalUsd = list.filter((i) => !i.inPantry).reduce((n, i) => n + i.costUsd, 0);
  return { items: list, meals, totalUsd, skipped: mealIds.length - meals.length };
}

export function formatQty(qty: number, unit: string): string {
  const q = Number.isInteger(qty) ? qty : Math.round(qty * 10) / 10;
  if (unit === "pcs") return `${q}`;
  if (unit === "g" && q >= 1000) return `${Math.round(q / 100) / 10} kg`;
  return `${q} ${unit}`;
}

export const ALLERGEN_LABEL: Record<Allergen, string> = {
  nuts: "Tree nuts",
  peanuts: "Peanuts",
  dairy: "Dairy",
  gluten: "Gluten",
  eggs: "Eggs",
  soy: "Soy",
  fish: "Fish",
  shellfish: "Shellfish",
  sesame: "Sesame",
};

export const DIET_LABEL: Record<Diet, string> = {
  none: "No preference",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
};
