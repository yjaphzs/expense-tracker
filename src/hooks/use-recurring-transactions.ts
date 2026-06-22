import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
  RecurringTransaction,
  RecurrenceFrequency,
  Transaction,
} from "@/types/transaction";

function getNextDate(from: string, frequency: RecurrenceFrequency): string {
  const d = new Date(from + "T00:00:00");
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Maximum number of transactions to backfill per recurring item per session
const MAX_BACKFILL = 90;

/**
 * Derived recurring-transaction helpers over lifted state. The state itself
 * lives in `useExpenseData`; `addTransaction` comes from `useTransactionLogic`.
 */
export function useRecurringLogic(
  recurring: RecurringTransaction[],
  setRecurring: Dispatch<SetStateAction<RecurringTransaction[]>>,
  addTransaction: (data: Omit<Transaction, "id">) => void,
) {
  const addRecurring = useCallback(
    (
      data: Omit<RecurringTransaction, "id" | "lastProcessedDate" | "enabled">,
    ) => {
      const today = toDateStr(new Date());
      // If start date is in the past, set lastProcessedDate so only the next
      // occurrence (today or future) fires — prevents mass backfill.
      const isPast = data.startDate < today;
      const item: RecurringTransaction = {
        ...data,
        id: crypto.randomUUID(),
        lastProcessedDate: isPast ? data.startDate : null,
        enabled: true,
      };
      setRecurring((prev) => [item, ...prev]);
    },
    [setRecurring],
  );

  const removeRecurring = useCallback(
    (id: string) => {
      setRecurring((prev) => prev.filter((r) => r.id !== id));
    },
    [setRecurring],
  );

  const toggleRecurring = useCallback(
    (id: string) => {
      setRecurring((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
      );
    },
    [setRecurring],
  );

  const editRecurring = useCallback(
    (
      id: string,
      data: Omit<RecurringTransaction, "id" | "lastProcessedDate" | "enabled">,
    ) => {
      setRecurring((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r)),
      );
    },
    [setRecurring],
  );

  const clearRecurring = useCallback(() => {
    setRecurring([]);
  }, [setRecurring]);

  const processDueTransactions = useCallback(() => {
    const today = toDateStr(new Date());

    // Compute the pending transactions and the updated recurring list BEFORE
    // touching any state, so we never nest one setState call inside another's
    // updater (transactions and recurring share a single store when signed in).
    const pendingTransactions: Omit<Transaction, "id">[] = [];
    let changed = false;

    const updated = recurring.map((r) => {
      if (!r.enabled) return r;

      // Determine the first due date
      let nextDue = r.lastProcessedDate
        ? getNextDate(r.lastProcessedDate, r.frequency)
        : r.startDate;

      let lastProcessed = r.lastProcessedDate;
      let count = 0;

      // Collect all transactions up to today, capped to prevent runaway backfill
      while (nextDue <= today && count < MAX_BACKFILL) {
        pendingTransactions.push({
          type: r.type,
          category: r.category,
          amount: r.amount,
          description: r.description
            ? `${r.description} (auto)`
            : `${r.category} (auto)`,
          date: nextDue,
          walletId: r.walletId,
        });
        lastProcessed = nextDue;
        nextDue = getNextDate(nextDue, r.frequency);
        count++;
      }

      if (lastProcessed !== r.lastProcessedDate) {
        changed = true;
        return { ...r, lastProcessedDate: lastProcessed };
      }
      return r;
    });

    if (pendingTransactions.length === 0) return;

    // Apply both updates as top-level setState calls (no nesting).
    if (changed) setRecurring(updated);
    for (const t of pendingTransactions) {
      addTransaction(t);
    }
  }, [recurring, addTransaction, setRecurring]);

  return {
    addRecurring,
    removeRecurring,
    toggleRecurring,
    editRecurring,
    clearRecurring,
    processDueTransactions,
  };
}
