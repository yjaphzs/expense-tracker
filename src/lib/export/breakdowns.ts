import { monthsIn, rangeLabel, type Period } from "@/lib/export/period";
import { addDays, parseLocalDate } from "@/lib/recurring-schedule";
import type { Transaction } from "@/types/transaction";

export interface PeriodRow {
  label: string;
  from: string;
  to: string;
  income: number;
  expense: number;
  net: number;
  /** Spending per day over the days counted (a partial week counts only its days). */
  avgPerDay: number;
}

export interface MonthDetail extends PeriodRow {
  weeks: PeriodRow[];
}

function row(label: string, from: string, to: string, items: Transaction[]): PeriodRow {
  const slice = items.filter((t) => t.date >= from && t.date <= to);
  const income = slice.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = slice.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
  return { label, from, to, income, expense, net: income - expense, avgPerDay: days > 0 ? expense / days : 0 };
}

/** Monday of the week containing `date`. */
function weekStart(date: string): string {
  const day = parseLocalDate(date).getDay(); // 0 = Sunday
  return addDays(date, -((day + 6) % 7));
}

/** Monday–Sunday weeks from `from` to `until`, each clipped to that range. */
export function weekRanges(from: string, until: string): { from: string; to: string }[] {
  const ranges: { from: string; to: string }[] = [];
  for (let start = weekStart(from); start <= until; start = addDays(start, 7)) {
    const end = addDays(start, 6);
    ranges.push({ from: start < from ? from : start, to: end > until ? until : end });
  }
  return ranges;
}

/** Weeks that have at least one transaction, newest first. */
export function weeklyBreakdown(items: Transaction[], from: string, until: string): PeriodRow[] {
  return weekRanges(from, until)
    .map((range) => row(rangeLabel(range), range.from, range.to, items))
    .filter((r) => r.income > 0 || r.expense > 0)
    .reverse();
}

const monthLabel = (month: string, style: "short" | "long") =>
  parseLocalDate(`${month}-01`).toLocaleDateString("en-US", { month: style, year: "numeric" });

function monthBounds(month: string, period: Period) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const from = `${month}-01` < period.from ? period.from : `${month}-01`;
  const to = `${month}-${last}` > period.to ? period.to : `${month}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

/** One row per month in the period, oldest first. */
export function monthlyBreakdown(items: Transaction[], period: Period): PeriodRow[] {
  return monthsIn(period).map((month) => {
    const { from, to } = monthBounds(month, period);
    return row(monthLabel(month, "short"), from, to, items);
  });
}

/** Each month with activity, and its weeks (clipped to the month). */
export function monthlyDetail(items: Transaction[], period: Period): MonthDetail[] {
  return monthsIn(period)
    .map((month) => {
      const { from, to } = monthBounds(month, period);
      const weeks = weekRanges(from, to).map((range) => row(rangeLabel(range), range.from, range.to, items));
      return { ...row(monthLabel(month, "long"), from, to, items), weeks };
    })
    .filter((month) => month.income > 0 || month.expense > 0);
}
