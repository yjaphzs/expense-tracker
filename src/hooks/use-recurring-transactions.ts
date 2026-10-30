import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { RecurringTransaction, Transaction } from "@/types/transaction";
import { dueDates, todayStr } from "@/lib/recurring-schedule";

export type RecurringInput = Omit<RecurringTransaction, "id" | "lastProcessedDate" | "enabled">;

/** Firestore rejects `undefined`, so an unset end date is left out entirely. */
function withEndDate<T extends { endDate?: string }>(item: T): T {
  if (item.endDate) return item;
  const { endDate: _endDate, ...rest } = item;
  return rest as T;
}

/**
 * Derived recurring-transaction helpers over lifted state. The state itself
 * lives in `useExpenseData`; `addTransaction` comes from `useTransactionLogic`.
 * Dates are calendar dates on this device (src/lib/recurring-schedule.ts).
 */
export function useRecurringLogic(
  recurring: RecurringTransaction[],
  setRecurring: Dispatch<SetStateAction<RecurringTransaction[]>>,
  addTransaction: (data: Omit<Transaction, "id">) => void,
) {
  const addRecurring = useCallback(
    (data: RecurringInput) => {
      // A start date in the past only fires from the next occurrence on (no mass backfill).
      const isPast = data.startDate < todayStr();
      const item: RecurringTransaction = withEndDate({
        ...data,
        id: crypto.randomUUID(),
        lastProcessedDate: isPast ? data.startDate : null,
        enabled: true,
      });
      setRecurring((prev) => [item, ...prev]);
    },
    [setRecurring],
  );

  const removeRecurring = useCallback(
    (id: string) => setRecurring((prev) => prev.filter((r) => r.id !== id)),
    [setRecurring],
  );

  const toggleRecurring = useCallback(
    (id: string) => setRecurring((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))),
    [setRecurring],
  );

  const editRecurring = useCallback(
    (id: string, data: RecurringInput) =>
      setRecurring((prev) => prev.map((r) => (r.id === id ? withEndDate({ ...r, ...data }) : r))),
    [setRecurring],
  );

  const clearRecurring = useCallback(() => setRecurring([]), [setRecurring]);

  const processDueTransactions = useCallback(() => {
    const today = todayStr();
    // Work out every pending transaction and the updated list BEFORE touching
    // state, so one setState never runs inside another's updater.
    const pending: Omit<Transaction, "id">[] = [];
    let changed = false;

    const updated = recurring.map((r) => {
      if (!r.enabled) return r;
      const dates = dueDates(r, today);
      if (dates.length === 0) return r;
      for (const date of dates) {
        pending.push({
          type: r.type,
          category: r.category,
          amount: r.amount,
          description: `${r.description || r.category} (auto)`,
          date,
          walletId: r.walletId,
        });
      }
      changed = true;
      return { ...r, lastProcessedDate: dates[dates.length - 1] };
    });

    if (!changed) return;
    setRecurring(updated);
    for (const t of pending) addTransaction(t);
  }, [recurring, addTransaction, setRecurring]);

  return { addRecurring, removeRecurring, toggleRecurring, editRecurring, clearRecurring, processDueTransactions };
}
