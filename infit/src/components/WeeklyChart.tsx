"use client";

import { useState } from "react";
import { formatShortDate } from "@/domain/dates";

export interface WeekBar {
  start: string;
  showedUp: number;
  partial: number;
  planned: number;
  current: boolean;
}

/**
 * Sessions per week. Single series (brand-600, validated) drawn over a
 * lighter same-ramp track showing what was planned. Columns are keyboard
 * focusable and carry their own tooltip; a table view mirrors every value.
 */
export function WeeklyChart({ weeks }: { weeks: WeekBar[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...weeks.map((w) => Math.max(w.planned, w.showedUp)));
  const H = 120;
  const ticks = max <= 4 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, Math.round(max / 2), max];

  return (
    <figure>
      <figcaption className="mb-1 text-sm font-bold text-muted">Sessions trained per week (last {weeks.length} weeks)</figcaption>
      <div className="mb-2 flex gap-4 text-xs text-muted" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-2.5 rounded-t-[3px] bg-brand-600" /> Trained
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-2.5 rounded-t-[3px] bg-brand-100" /> Planned
        </span>
      </div>
      <div className="relative flex gap-2 pl-6">
        {/* y-axis ticks */}
        <div className="absolute inset-y-0 left-0 w-6" aria-hidden style={{ height: H }}>
          {ticks.map((t) => (
            <span key={t} className="tabular absolute left-0 -translate-y-1/2 text-[11px] text-muted" style={{ top: H - (t / max) * H }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative flex flex-1 items-end justify-between" style={{ height: H }}>
          {ticks.map((t) => (
            <span key={t} className="absolute inset-x-0 h-px bg-line" style={{ top: H - (t / max) * H }} aria-hidden />
          ))}
          {weeks.map((w, i) => {
            const label = `Week of ${formatShortDate(w.start)}${w.current ? " (this week)" : ""}: ${w.showedUp} of ${w.planned} planned sessions${w.partial ? `, ${w.partial} partly completed` : ""}`;
            return (
              <button
                key={w.start}
                type="button"
                aria-label={label}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="relative flex h-full flex-1 items-end justify-center rounded-lg"
              >
                {/* planned track */}
                <span
                  className="absolute bottom-0 w-[min(24px,70%)] rounded-t-[4px] bg-brand-100"
                  style={{ height: (w.planned / max) * H }}
                  aria-hidden
                />
                {/* trained */}
                <span
                  className={`relative w-[min(24px,70%)] rounded-t-[4px] bg-brand-600 transition-opacity ${active !== null && active !== i ? "opacity-60" : ""}`}
                  style={{ height: (w.showedUp / max) * H }}
                  aria-hidden
                />
                {active === i && (
                  <span
                    role="tooltip"
                    className="absolute bottom-full z-10 mb-2 w-max max-w-40 rounded-xl bg-ink px-3 py-2 text-left text-xs text-white shadow-lg"
                  >
                    <span className="block text-sm font-black">
                      {w.showedUp} of {w.planned}
                    </span>
                    <span className="block text-white/80">
                      {formatShortDate(w.start)} week{w.partial ? ` · ${w.partial} partly` : ""}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex justify-between gap-2 pl-6 text-[11px] text-muted" aria-hidden>
        {weeks.map((w) => (
          <span key={w.start} className="flex-1 text-center">
            {w.current ? "Now" : formatShortDate(w.start).split(" ")[0]}
          </span>
        ))}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-extrabold text-brand-700">Show as table</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-muted">
              <th className="py-1 font-bold">Week of</th>
              <th className="py-1 font-bold">Trained</th>
              <th className="py-1 font-bold">Partly</th>
              <th className="py-1 font-bold">Planned</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {weeks.map((w) => (
              <tr key={w.start} className="border-t border-line">
                <td className="py-1">
                  {formatShortDate(w.start)}
                  {w.current ? " (this week)" : ""}
                </td>
                <td className="py-1">{w.showedUp}</td>
                <td className="py-1">{w.partial}</td>
                <td className="py-1">{w.planned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
