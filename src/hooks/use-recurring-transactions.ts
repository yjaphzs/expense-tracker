import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
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

export function useRecurringTransactions(
  storageKey: string,
  addTransaction: (data: Omit<Transaction, "id">) => void,
  autosave = true
) {
  const [recurringList, setRecurringList] = useLocalStorage<
    RecurringTransaction[]
  >(storageKey, [], { enabled: autosave });

  const addRecurring = (data: Omit<RecurringTransaction, "id" | "lastProcessedDate" | "enabled">) => {
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
    setRecurringList((prev) => [item, ...prev]);
  };

  const removeRecurring = (id: string) => {
    setRecurringList((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleRecurring = (id: string) => {
    setRecurringList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const editRecurring = (id: string, data: Omit<RecurringTransaction, "id" | "lastProcessedDate" | "enabled">) => {
    setRecurringList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    );
  };

  const clearRecurring = () => {
    setRecurringList([]);
  };

  const processDueTransactions = useCallback(() => {
    const today = toDateStr(new Date());

    setRecurringList((prev) => {
      const pendingTransactions: Omit<Transaction, "id">[] = [];
      const updated = prev.map((r) => {
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
          return { ...r, lastProcessedDate: lastProcessed };
        }
        return r;
      });

      // Nothing to process — return same reference to avoid state update
      if (pendingTransactions.length === 0) return prev;

      for (const t of pendingTransactions) {
        addTransaction(t);
      }
      return updated;
    });
  }, [addTransaction, setRecurringList]);

  return {
    recurringList,
    setRecurringList,
    addRecurring,
    removeRecurring,
    toggleRecurring,
    editRecurring,
    clearRecurring,
    processDueTransactions,
  };
}
