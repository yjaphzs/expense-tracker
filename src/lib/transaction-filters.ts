import { addDays, toLocalDateStr } from "@/lib/recurring-schedule";
import type { Transaction, Wallet } from "@/types/transaction";
import { isTransfer } from "@/types/transaction";

export type DatePreset = "all" | "this-month" | "last-month" | "last-30" | "this-year" | "custom";

export interface TransactionFilter {
  query: string;
  categories: string[];
  walletIds: string[];
  datePreset: DatePreset;
  /** Only used with the "custom" preset ("YYYY-MM-DD", inclusive). */
  from?: string;
  to?: string;
}

export const EMPTY_FILTER: TransactionFilter = { query: "", categories: [], walletIds: [], datePreset: "all" };

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  all: "Any time",
  "this-month": "This month",
  "last-month": "Last month",
  "last-30": "Last 30 days",
  "this-year": "This year",
  custom: "Custom range",
};

/** Inclusive date range for a preset, relative to `today`. */
export function presetRange(filter: TransactionFilter, today: Date): { from?: string; to?: string } {
  const y = today.getFullYear();
  const m = today.getMonth();
  const todayStr = toLocalDateStr(today);
  switch (filter.datePreset) {
    case "this-month":
      return { from: toLocalDateStr(new Date(y, m, 1)), to: toLocalDateStr(new Date(y, m + 1, 0)) };
    case "last-month":
      return { from: toLocalDateStr(new Date(y, m - 1, 1)), to: toLocalDateStr(new Date(y, m, 0)) };
    case "last-30":
      return { from: addDays(todayStr, -29), to: todayStr };
    case "this-year":
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    case "custom":
      return { from: filter.from, to: filter.to };
    default:
      return {};
  }
}

/** How many filters are set (the badge on the Filters button); search isn't counted. */
export function activeFilterCount(filter: TransactionFilter): number {
  return (
    (filter.categories.length > 0 ? 1 : 0) +
    (filter.walletIds.length > 0 ? 1 : 0) +
    (filter.datePreset !== "all" ? 1 : 0)
  );
}

export function isFiltering(filter: TransactionFilter): boolean {
  return filter.query.trim() !== "" || activeFilterCount(filter) > 0;
}

/** Transactions matching every part of the filter. Search covers description, category, wallet and amount. */
export function applyFilter(
  transactions: Transaction[],
  filter: TransactionFilter,
  wallets: Wallet[],
  today = new Date(),
): Transaction[] {
  if (!isFiltering(filter)) return transactions;
  const query = filter.query.trim().toLowerCase();
  const { from, to } = presetRange(filter, today);
  const walletName = new Map(wallets.map((w) => [w.id, w.name.toLowerCase()]));
  const categories = new Set(filter.categories);
  const walletIds = new Set(filter.walletIds);

  return transactions.filter((t) => {
    if (categories.size > 0 && !categories.has(isTransfer(t) ? "Transfer" : t.category)) return false;
    if (walletIds.size > 0 && !walletIds.has(t.walletId)) return false;
    if (from && t.date < from) return false;
    if (to && t.date > to) return false;
    if (!query) return true;
    return (
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      (walletName.get(t.walletId) ?? "").includes(query) ||
      t.amount.toFixed(2).includes(query.replace(/[₱,\s]/g, ""))
    );
  });
}

/** Net of the matching transactions (transfers excluded): income minus expenses. */
export function filteredNet(transactions: Transaction[]): number {
  return transactions.reduce(
    (sum, t) => (isTransfer(t) ? sum : sum + (t.type === "income" ? t.amount : -t.amount)),
    0,
  );
}
