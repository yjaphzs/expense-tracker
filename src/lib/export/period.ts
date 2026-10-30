import { parseLocalDate, toLocalDateStr } from "@/lib/recurring-schedule";
import type { Transaction } from "@/types/transaction";

export type PeriodPreset = "this-month" | "last-month" | "last-3" | "last-6" | "this-year" | "last-year" | "all";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "last-3", label: "Last 3 Months" },
  { value: "last-6", label: "Last 6 Months" },
  { value: "this-year", label: "This Year" },
  { value: "last-year", label: "Last Year" },
  { value: "all", label: "All Time" },
];

export interface Period {
  preset: PeriodPreset;
  label: string;
  /** Inclusive "YYYY-MM-DD" bounds; for All Time, the first and last transaction dates. */
  from: string;
  to: string;
}

const monthStart = (y: number, m: number) => toLocalDateStr(new Date(y, m, 1));
const monthEnd = (y: number, m: number) => toLocalDateStr(new Date(y, m + 1, 0));

/** The date range a preset covers, as of `today`. */
export function resolvePeriod(preset: PeriodPreset, today: Date, transactions: Transaction[] = []): Period {
  const y = today.getFullYear();
  const m = today.getMonth();
  const label = PERIOD_PRESETS.find((p) => p.value === preset)?.label ?? "";
  const range = (from: string, to: string): Period => ({ preset, label, from, to });
  switch (preset) {
    case "this-month":
      return range(monthStart(y, m), monthEnd(y, m));
    case "last-month":
      return range(monthStart(y, m - 1), monthEnd(y, m - 1));
    case "last-3":
      return range(monthStart(y, m - 2), monthEnd(y, m));
    case "last-6":
      return range(monthStart(y, m - 5), monthEnd(y, m));
    case "this-year":
      return range(`${y}-01-01`, `${y}-12-31`);
    case "last-year":
      return range(`${y - 1}-01-01`, `${y - 1}-12-31`);
    default: {
      const dates = transactions.map((t) => t.date).sort();
      const todayStr = toLocalDateStr(today);
      return range(dates[0] ?? todayStr, dates[dates.length - 1] ?? todayStr);
    }
  }
}

export const inPeriod = (t: Pick<Transaction, "date">, period: Period) => t.date >= period.from && t.date <= period.to;

/** "Oct 1–31, 2026", "Sep 1 – Nov 30, 2026", "Dec 1, 2025 – Feb 28, 2026". En dash only between numbers. */
export function rangeLabel(period: Pick<Period, "from" | "to">): string {
  const from = parseLocalDate(period.from);
  const to = parseLocalDate(period.to);
  const md = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (from.getFullYear() !== to.getFullYear()) return `${md(from)}, ${from.getFullYear()} – ${md(to)}, ${to.getFullYear()}`;
  if (from.getMonth() === to.getMonth()) return `${md(from)}–${to.getDate()}, ${to.getFullYear()}`;
  return `${md(from)} – ${md(to)}, ${to.getFullYear()}`;
}

/** Calendar months the period touches (budget limits are monthly). */
export function monthsIn(period: Pick<Period, "from" | "to">): string[] {
  const months: string[] = [];
  const end = period.to.slice(0, 7);
  let [y, m] = period.from.slice(0, 7).split("-").map(Number);
  for (let key = period.from.slice(0, 7); key <= end; ) {
    months.push(key);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    key = `${y}-${String(m).padStart(2, "0")}`;
  }
  return months;
}
