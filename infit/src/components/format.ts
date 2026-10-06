import type { DisplayDetail, RepTarget, WeightUnit } from "@/domain/schema";

export function range(t: RepTarget): string {
  return t.min === t.max ? `${t.max}` : `${t.min}–${t.max}`;
}

/** Plain language for "simple" detail, gym notation for "detailed". */
export function targetText(sets: number, t: RepTarget, unit: "reps" | "seconds", detail: DisplayDetail): string {
  const amount = unit === "seconds" ? `${range(t)} sec` : `${range(t)} reps`;
  if (detail === "detailed") return `${sets} × ${amount}`;
  return `${sets} round${sets === 1 ? "" : "s"} of ${unit === "seconds" ? `${range(t)} seconds` : `${range(t)} reps`}`;
}

export function toDisplayLoad(kg: number, unit: WeightUnit): number {
  return unit === "lb" ? Math.round(kg * 2.20462 * 2) / 2 : Math.round(kg * 100) / 100;
}

export function fromDisplayLoad(value: number, unit: WeightUnit): number {
  return unit === "lb" ? Math.round((value / 2.20462) * 100) / 100 : value;
}

export function loadText(kg: number | null, unit: WeightUnit): string {
  return kg === null ? "" : `${toDisplayLoad(kg, unit)} ${unit}`;
}

export function clockText(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
