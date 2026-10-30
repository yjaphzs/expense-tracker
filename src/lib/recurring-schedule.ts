import type { RecurrenceFrequency, RecurringTransaction } from "@/types/transaction";

export const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
];

export const FREQUENCY_LABELS = Object.fromEntries(
  FREQUENCY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<RecurrenceFrequency, string>;

// Most occurrences one item may add in a single catch-up pass.
export const MAX_BACKFILL = 90;

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" in the device's time zone. Never use toISOString() for this: it's UTC. */
export function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today's date on this device, as "YYYY-MM-DD". */
export function todayStr(): string {
  return toLocalDateStr(new Date());
}

/** Local midnight for a "YYYY-MM-DD" string (for date pickers and display). */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The occurrence after `date`. The arithmetic runs on calendar dates (UTC
 * internally), so the device's time zone can't shift the result. Monthly items
 * keep their start day, clamped in short months: Jan 31 → Feb 28 → Mar 31.
 */
export function addInterval(date: string, frequency: RecurrenceFrequency, anchorDay?: number): string {
  const [y, m, d] = date.split("-").map(Number);
  if (frequency === "monthly") {
    const year = m === 12 ? y + 1 : y;
    const month = m === 12 ? 1 : m + 1;
    const day = Math.min(anchorDay ?? d, daysInMonth(year, month));
    return `${year}-${pad(month)}-${pad(day)}`;
  }
  return addDays(date, frequency === "daily" ? 1 : frequency === "weekly" ? 7 : 14);
}

const anchorOf = (item: RecurringTransaction) => Number(item.startDate.slice(8, 10));

/** The next date this item adds a transaction on, or null once it has ended. */
export function nextDueDate(item: RecurringTransaction): string | null {
  const next = item.lastProcessedDate
    ? addInterval(item.lastProcessedDate, item.frequency, anchorOf(item))
    : item.startDate;
  return item.endDate && next > item.endDate ? null : next;
}

/** Whether the item has passed its end date and will add nothing more. */
export function isFinished(item: RecurringTransaction): boolean {
  return nextDueDate(item) === null;
}

/** Every date due on or before `today` that hasn't been added yet (capped). */
export function dueDates(item: RecurringTransaction, today: string, max = MAX_BACKFILL): string[] {
  const dates: string[] = [];
  let next = nextDueDate(item);
  while (next && next <= today && dates.length < max) {
    dates.push(next);
    next = addInterval(next, item.frequency, anchorOf(item));
    if (item.endDate && next > item.endDate) next = null;
  }
  return dates;
}

export interface UpcomingItem {
  item: RecurringTransaction;
  date: string;
}

/** Each active item's next date within `days` days from today, soonest first. */
export function upcoming(items: RecurringTransaction[], today: string, days = 7): UpcomingItem[] {
  const until = addDays(today, days);
  return items
    .filter((item) => item.enabled)
    .map((item) => ({ item, date: nextDueDate(item) }))
    .filter((entry): entry is UpcomingItem => !!entry.date && entry.date >= today && entry.date <= until)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** `date` plus `days` calendar days. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}
