import clsx from "clsx";
import { Check, Dumbbell, Moon, Star } from "lucide-react";
import { fromISODate, WEEKDAY_LONG, WEEKDAY_SHORT, weekdayOf } from "@/domain/dates";
import type { DayStatus } from "@/domain/progress";

const STATE_TEXT: Record<DayStatus["state"], string> = {
  rest: "rest day",
  upcoming: "workout planned",
  today: "workout planned today",
  completed: "completed",
  partial: "partly completed",
  "not-done": "not done",
  extra: "extra session",
};

export function WeekStrip({ days, today }: { days: DayStatus[]; today: string }) {
  return (
    <ol className="grid grid-cols-7 gap-1.5" aria-label="This week">
      {days.map((d) => {
        const wd = weekdayOf(d.date);
        const isToday = d.date === today;
        return (
          <li key={d.date} className="flex flex-col items-center gap-1">
            <span className={clsx("text-xs font-extrabold", isToday ? "text-brand-700" : "text-muted")} aria-hidden>
              {WEEKDAY_SHORT[wd].slice(0, 2)}
            </span>
            <span
              className={clsx(
                "flex size-10 items-center justify-center rounded-2xl border-2 text-sm font-extrabold sm:size-11",
                d.state === "completed" && "border-aqua-500 bg-aqua-500 text-white",
                d.state === "partial" && "border-aqua-500 bg-aqua-100 text-aqua-800",
                d.state === "extra" && "border-sun-500 bg-sun-100 text-sun-800",
                d.state === "rest" && "border-transparent bg-sunken text-muted",
                (d.state === "upcoming" || d.state === "today") && "border-brand-300 bg-surface text-brand-700",
                d.state === "not-done" && "border-line bg-surface text-muted",
                isToday && "ring-2 ring-brand-600 ring-offset-2 ring-offset-canvas",
              )}
            >
              <span className="sr-only">
                {WEEKDAY_LONG[wd]} {fromISODate(d.date).getDate()}
                {isToday ? " (today)" : ""}: {STATE_TEXT[d.state]}
                {d.planned ? ` — ${d.planned.name}` : ""}
              </span>
              <span aria-hidden>
                {d.state === "completed" ? (
                  <Check className="size-5" strokeWidth={3} />
                ) : d.state === "partial" ? (
                  <span className="text-xs">½</span>
                ) : d.state === "extra" ? (
                  <Star className="size-4" />
                ) : d.state === "rest" ? (
                  <Moon className="size-4" />
                ) : d.state === "not-done" ? (
                  fromISODate(d.date).getDate()
                ) : (
                  <Dumbbell className="size-4" />
                )}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function WeekLegend() {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      <li className="flex items-center gap-1">
        <span className="size-3 rounded bg-aqua-500" aria-hidden /> Done
      </li>
      <li className="flex items-center gap-1">
        <span className="size-3 rounded border-2 border-aqua-500 bg-aqua-100" aria-hidden /> Partly done
      </li>
      <li className="flex items-center gap-1">
        <span className="size-3 rounded border-2 border-brand-300" aria-hidden /> Planned
      </li>
      <li className="flex items-center gap-1">
        <span className="size-3 rounded bg-sunken" aria-hidden /> Rest
      </li>
    </ul>
  );
}
