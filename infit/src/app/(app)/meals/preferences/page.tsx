"use client";

import { ArrowLeft, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/toast";
import { Button, Card, Chip, LinkButton, Notice, PageHeader, Stepper } from "@/components/ui";
import { ALLERGEN_LABEL, CURRENCY, DIET_LABEL } from "@/domain/meals";
import { type Allergen, type Currency, type Diet, MealPreferences } from "@/domain/schema";
import { now, useAppStore } from "@/store/appStore";

const COMMON_PANTRY = [
  "Rice",
  "Pasta",
  "Oats",
  "Olive oil",
  "Onion",
  "Chopped tomatoes",
  "Eggs",
  "Frozen peas",
  "Potatoes",
  "Soy sauce",
];

export default function MealPreferencesPage() {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const existing = data.meals.prefs;
  const [currency, setCurrency] = useState<Currency>(existing?.currency ?? "GBP");
  const [budget, setBudget] = useState<number | null>(existing?.weeklyBudget ?? 50);
  const [people, setPeople] = useState<number | null>(existing?.people ?? 1);
  const [diet, setDiet] = useState<Diet>(existing?.diet ?? "none");
  const [allergies, setAllergies] = useState<Allergen[]>(existing?.allergies ?? []);
  const [cookingTime, setCookingTime] = useState<MealPreferences["cookingTime"]>(existing?.cookingTime ?? "medium");
  const [pantry, setPantry] = useState<string[]>(existing?.pantry ?? []);
  const [pantryInput, setPantryInput] = useState("");
  const [nutrition, setNutrition] = useState(Boolean(data.profile?.showNutritionDetail));
  const [error, setError] = useState<string | null>(null);

  const addPantry = (item: string) => {
    const v = item.trim().slice(0, 40);
    if (!v || pantry.some((p) => p.toLowerCase() === v.toLowerCase())) return;
    setPantry((p) => [...p, v].slice(0, 60));
  };

  const save = () => {
    const parsed = MealPreferences.safeParse({
      currency,
      weeklyBudget: budget,
      people,
      diet,
      allergies,
      cookingTime,
      pantry,
      updatedAt: now(),
    });
    if (!parsed.success || !budget || !people) {
      setError("Please enter a weekly budget and the number of people.");
      return;
    }
    update((d) => ({
      ...d,
      meals: { ...d.meals, prefs: parsed.data },
      profile: d.profile ? { ...d.profile, showNutritionDetail: nutrition } : d.profile,
    }));
    toast("Meal preferences saved");
    router.push("/meals");
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        back={
          <LinkButton href="/meals" variant="ghost" size="sm" className="-ml-3">
            <ArrowLeft className="size-5" aria-hidden /> Meals
          </LinkButton>
        }
        title="Meal preferences"
        subtitle="Used only to suggest meals. Stored in this browser."
      />

      <Card>
        <fieldset>
          <legend className="text-lg font-extrabold">Weekly food budget</legend>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Currency">
            {(Object.keys(CURRENCY) as Currency[]).map((c) => (
              <Chip key={c} role="radio" selected={currency === c} onClick={() => setCurrency(c)}>
                {CURRENCY[c].symbol} {c}
              </Chip>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1 block text-sm font-bold" aria-hidden>
                Budget per week ({CURRENCY[currency].symbol})
              </span>
              <Stepper label={`Weekly budget in ${currency}`} value={budget} onChange={setBudget} step={5} min={0} max={5000} />
            </div>
            <div>
              <span className="mb-1 block text-sm font-bold" aria-hidden>
                People it covers
              </span>
              <Stepper label="People the budget covers" value={people} onChange={setPeople} min={1} max={12} />
            </div>
          </div>
        </fieldset>
      </Card>

      <Card>
        <fieldset>
          <legend className="text-lg font-extrabold">Diet</legend>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Diet">
            {(Object.keys(DIET_LABEL) as Diet[]).map((d) => (
              <Chip key={d} role="radio" selected={diet === d} onClick={() => setDiet(d)}>
                {DIET_LABEL[d]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-5">
          <legend className="text-lg font-extrabold">Allergies or foods to avoid</legend>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Allergies">
            {(Object.keys(ALLERGEN_LABEL) as Allergen[]).map((a) => (
              <Chip
                key={a}
                selected={allergies.includes(a)}
                onClick={() => setAllergies((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]))}
              >
                {ALLERGEN_LABEL[a]}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">
            We filter our small recipe set by these, but we can&apos;t guarantee products are free from allergens. Always check
            labels.
          </p>
        </fieldset>
      </Card>

      <Card>
        <fieldset>
          <legend className="text-lg font-extrabold">Cooking time</legend>
          <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Cooking time">
            {(
              [
                ["quick", "Quick", "≤ 15 min"],
                ["medium", "Medium", "≤ 30 min"],
                ["relaxed", "Relaxed", "Any"],
              ] as const
            ).map(([v, l, d]) => (
              <Chip
                key={v}
                role="radio"
                selected={cookingTime === v}
                className="min-h-14 flex-col gap-0"
                onClick={() => setCookingTime(v)}
              >
                {l}
                <span className="text-xs font-bold text-muted">{d}</span>
              </Chip>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card>
        <fieldset>
          <legend className="text-lg font-extrabold">Already in your kitchen</legend>
          <p className="mt-1 text-sm text-muted">We&apos;ll favour meals that use these and leave them off your shopping list.</p>
          {pantry.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {pantry.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => setPantry((x) => x.filter((y) => y !== p))}
                    className="inline-flex min-h-10 items-center gap-1 rounded-full bg-brand-100 px-3 text-sm font-bold text-brand-800"
                    aria-label={`Remove ${p}`}
                  >
                    {p} <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addPantry(pantryInput);
              setPantryInput("");
            }}
          >
            <label htmlFor="pantry" className="sr-only">
              Add an ingredient you have
            </label>
            <input
              id="pantry"
              value={pantryInput}
              maxLength={40}
              onChange={(e) => setPantryInput(e.target.value)}
              placeholder="e.g. rice"
              className="min-h-12 min-w-0 flex-1 rounded-2xl border-2 border-line px-4 outline-none focus:border-brand-500"
            />
            <Button type="submit" variant="secondary" aria-label="Add ingredient" disabled={!pantryInput.trim()}>
              <Plus className="size-5" aria-hidden />
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {COMMON_PANTRY.filter((c) => !pantry.some((p) => p.toLowerCase() === c.toLowerCase())).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => addPantry(c)}
                className="min-h-10 rounded-full border-2 border-dashed border-line px-3 text-sm font-bold text-muted hover:border-brand-300"
              >
                + {c}
              </button>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={nutrition}
            onChange={(e) => setNutrition(e.target.checked)}
            className="mt-1 size-5 accent-brand-600"
          />
          <span>
            <span className="block font-extrabold">Show approximate calories and protein</span>
            <span className="block text-sm text-muted">Optional. Estimates only — Infit doesn&apos;t require tracking.</span>
          </span>
        </label>
      </Card>

      {error && <Notice tone="warning">{error}</Notice>}
      <Button size="lg" onClick={save}>
        Save preferences
      </Button>
    </div>
  );
}
