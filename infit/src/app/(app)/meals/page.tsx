"use client";

import { ArrowLeft, Bookmark, BookmarkCheck, Clock, Settings2, ShoppingBasket } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/toast";
import { Badge, Card, EmptyState, LinkButton, Notice, PageHeader, SectionTitle } from "@/components/ui";
import Link from "next/link";
import {
  ALLERGEN_LABEL,
  CURRENCY,
  DIET_LABEL,
  formatMoney,
  formatQty,
  servingBudgetUsd,
  shoppingList,
  suggestMeals,
} from "@/domain/meals";
import { useAppStore } from "@/store/appStore";

export default function MealsPage() {
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const prefs = data.meals.prefs;
  const saved = data.meals.saved;
  const showNutrition = Boolean(data.profile?.showNutritionDetail);
  const [checked, setChecked] = useState<string[]>([]);
  const meals = suggestMeals(prefs);
  const list = shoppingList(saved, prefs);
  const currency = prefs?.currency ?? "USD";
  const money = (usd: number) => formatMoney(usd, currency);

  const toggle = (id: string, name: string) => {
    const isSaved = saved.includes(id);
    update((d) => ({
      ...d,
      meals: { ...d.meals, saved: isSaved ? d.meals.saved.filter((x) => x !== id) : [...d.meals.saved, id] },
    }));
    toast(isSaved ? `Removed ${name}` : `Added ${name} to this week`);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        back={
          <LinkButton href="/today" variant="ghost" size="sm" className="-ml-3">
            <ArrowLeft className="size-5" aria-hidden /> Today
          </LinkButton>
        }
        title="Meals on a budget"
        subtitle="Simple ideas that fit your week. Tracking calories is optional."
        action={
          <LinkButton href="/meals/preferences" size="sm" variant="secondary" className="shrink-0 whitespace-nowrap">
            <Settings2 className="size-4" aria-hidden /> {prefs ? "Edit" : "Set up"}
          </LinkButton>
        }
      />

      {prefs ? (
        <Card className="bg-sun-100/60">
          <p className="font-extrabold">
            {CURRENCY[currency].symbol}
            {prefs.weeklyBudget} a week for {prefs.people} {prefs.people === 1 ? "person" : "people"}
          </p>
          <p className="mt-1 text-sm text-muted">
            About {money(servingBudgetUsd(prefs))} per serving (assuming ~14 main meals a week) · {DIET_LABEL[prefs.diet]}
            {prefs.allergies.length > 0 &&
              ` · avoiding ${prefs.allergies.map((a) => ALLERGEN_LABEL[a].toLowerCase()).join(", ")}`}
          </p>
        </Card>
      ) : (
        <Notice tone="warning" title="Not tailored to you yet">
          These ideas don&apos;t yet account for your allergies, diet or budget.{" "}
          <Link href="/meals/preferences" className="font-extrabold underline">
            Set your preferences
          </Link>{" "}
          first if you have any dietary needs.
        </Notice>
      )}

      <Notice tone="info">
        Costs are rough estimates from typical supermarket prices, not live store prices. Nutrition figures are approximate and
        not verified. Always check labels for allergens.
      </Notice>

      <section aria-labelledby="ideas-title">
        <SectionTitle id="ideas-title">Ideas for this week</SectionTitle>
        {meals.length === 0 ? (
          <EmptyState title="No curated meals match">
            Our small starter set can&apos;t safely meet every combination of preferences yet. Try a longer cooking time, or
            adjust your preferences.
          </EmptyState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {meals.map((m) => {
              const isSaved = saved.includes(m.meal.id);
              return (
                <li key={m.meal.id}>
                  <Card className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold">{m.meal.name}</h3>
                      <button
                        type="button"
                        aria-pressed={isSaved}
                        aria-label={isSaved ? `Remove ${m.meal.name} from this week` : `Add ${m.meal.name} to this week`}
                        onClick={() => toggle(m.meal.id, m.meal.name)}
                        className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-2xl text-brand-700 hover:bg-brand-50"
                      >
                        {isSaved ? <BookmarkCheck className="size-6 fill-brand-200" /> : <Bookmark className="size-6" />}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="neutral">
                        <Clock className="size-3.5" aria-hidden /> {m.meal.minutes} min
                      </Badge>
                      {prefs && <Badge tone="sun">est. {money(m.costPerServingUsd)}/serving</Badge>}
                      {m.fitsBudget === true && <Badge tone="mint">Fits budget</Badge>}
                      {m.fitsBudget === false && <Badge tone="coral">Above budget</Badge>}
                      {m.meal.type === "breakfast" && <Badge tone="aqua">Breakfast</Badge>}
                    </div>
                    {m.substitutions.length > 0 && (
                      <p className="mt-2 text-sm">
                        <span className="font-bold">Swapped for you: </span>
                        {m.substitutions.map((s) => `${s.from} → ${s.to}`).join("; ")}
                      </p>
                    )}
                    {m.pantryMatches > 0 && (
                      <p className="mt-1 text-sm text-mint-700">Uses {m.pantryMatches} thing(s) you already have</p>
                    )}
                    {showNutrition && (
                      <p className="mt-1 text-sm text-muted">
                        Approx. {m.meal.kcal} kcal · {m.meal.proteinG} g protein per serving (estimate)
                      </p>
                    )}
                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer font-bold text-brand-700">Ingredients & method</summary>
                      <ul className="mt-1 list-disc pl-5">
                        {m.ingredients.map((i) => (
                          <li key={i.id}>
                            {formatQty(i.qty, i.unit)} {i.name}
                            {i.inPantry && <span className="text-mint-700"> (you have this)</span>}
                          </li>
                        ))}
                      </ul>
                      <ol className="mt-2 list-decimal pl-5">
                        {m.meal.steps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    </details>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Card aria-labelledby="shop-title">
        <SectionTitle id="shop-title">
          <span className="flex items-center gap-2">
            <ShoppingBasket className="size-5" aria-hidden /> Shopping list
          </span>
        </SectionTitle>
        {list.items.length === 0 ? (
          <EmptyState title="Your list is empty">
            Add meals to this week with the bookmark button and we&apos;ll combine the ingredients.
          </EmptyState>
        ) : (
          <>
            <p className="text-sm text-muted">
              For {list.meals.map((m) => m.meal.name).join(", ")} × {prefs?.people ?? 1}{" "}
              {prefs?.people === 1 || !prefs ? "serving" : "servings"} each.
              {list.skipped > 0 && ` ${list.skipped} saved meal(s) no longer fit your preferences and were left out.`}
            </p>
            {Object.entries(
              list.items.reduce<Record<string, typeof list.items>>((acc, i) => {
                (acc[i.category] ??= []).push(i);
                return acc;
              }, {}),
            ).map(([cat, items]) => (
              <div key={cat} className="mt-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-muted">{cat}</h3>
                <ul className="mt-1">
                  {items.map((i) => (
                    <li key={i.id}>
                      <label className="flex min-h-11 cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          className="size-5 accent-brand-600"
                          checked={i.inPantry || checked.includes(i.id)}
                          disabled={i.inPantry}
                          onChange={() => setChecked((c) => (c.includes(i.id) ? c.filter((x) => x !== i.id) : [...c, i.id]))}
                        />
                        <span className={i.inPantry || checked.includes(i.id) ? "text-muted line-through" : ""}>
                          {formatQty(i.qty, i.unit)} {i.name}
                        </span>
                        <span className="ml-auto text-sm text-muted">
                          {i.inPantry ? "have it" : prefs ? `~${money(i.costUsd)}` : ""}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {prefs ? (
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-sunken p-3 font-extrabold">
                <span>Estimated total</span>
                <span>~{money(list.totalUsd)}</span>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">Set your meal preferences to see cost estimates in your currency.</p>
            )}
            {prefs && (
              <p className="mt-2 text-sm text-muted">
                That&apos;s about {Math.round((list.totalUsd * 100) / (prefs.weeklyBudget / CURRENCY[currency].rate))}% of your
                weekly budget (estimate). Quantities are per recipe, not pack sizes.
              </p>
            )}
            <p className="mt-2 text-xs text-muted">Ticks on this list aren&apos;t saved.</p>
          </>
        )}
      </Card>
    </div>
  );
}
