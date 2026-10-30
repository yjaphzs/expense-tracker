"use client";

import { CalendarClockIcon } from "lucide-react";

import { useCategoryIcon, useTracker } from "@/context/tracker-context";
import { parseLocalDate, todayStr, upcoming } from "@/lib/recurring-schedule";
import { formatCurrency } from "@/lib/utils";

const UPCOMING_DAYS = 7;

const dayLabel = (date: string, today: string) => {
  if (date === today) return "Today";
  return parseLocalDate(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

/** Recurring items due in the next week, soonest first. Hidden when nothing's due. */
export function UpcomingCard() {
  const { data } = useTracker();
  const iconFor = useCategoryIcon();
  const today = todayStr();
  const due = upcoming(data.recurring, today, UPCOMING_DAYS);
  if (due.length === 0) return null;

  return (
    <section aria-labelledby="upcoming-heading" className="mt-4 rounded-lg border border-dashed bg-muted/30 p-4">
      <h3 id="upcoming-heading" className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <CalendarClockIcon className="size-4 text-primary" />
        Coming up in the next {UPCOMING_DAYS} days
      </h3>
      <ul className="flex flex-col gap-2">
        {due.map(({ item, date }) => {
          const Icon = iconFor(item.category);
          return (
            <li key={item.id} className="flex items-center gap-3 text-sm">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{item.description || item.category}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{dayLabel(date, today)}</span>
              <span
                className={`w-24 shrink-0 text-right font-mono font-semibold ${
                  item.type === "income" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                }`}
              >
                {item.type === "income" ? "+" : "-"}
                {formatCurrency(item.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
