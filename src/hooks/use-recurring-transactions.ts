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

export const RECURRING_STORAGE_KEY = "expense-tracker-recurring";

export function useRecurringTransactions(
  addTransaction: (data: Omit<Transaction, "id">) => void,
  autosave = true
) {
  const [recurringList, setRecurringList] = useLocalStorage<
    RecurringTransaction[]
  >(RECURRING_STORAGE_KEY, [], { enabled: autosave });

  const addRecurring = (data: Omit<RecurringTransaction, "id" | "lastProcessedDate" | "enabled">) => {
    const item: RecurringTransaction = {
      ...data,
      id: crypto.randomUUID(),
      lastProcessedDate: null,
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

  const clearRecurring = () => {
    setRecurringList([]);
  };

  const processDueTransactions = useCallback(() => {
    const today = toDateStr(new Date());
    let anyProcessed = false;

    setRecurringList((prev) =>
      prev.map((r) => {
        if (!r.enabled) return r;

        // Determine the first due date
        let nextDue = r.lastProcessedDate
          ? getNextDate(r.lastProcessedDate, r.frequency)
          : r.startDate;

        let lastProcessed = r.lastProcessedDate;

        // Generate all transactions up to today
        while (nextDue <= today) {
          addTransaction({
            type: r.type,
            category: r.category,
            amount: r.amount,
            description: r.description
              ? `${r.description} (auto)`
              : `${r.category} (auto)`,
            date: nextDue,
          });
          lastProcessed = nextDue;
          anyProcessed = true;
          nextDue = getNextDate(nextDue, r.frequency);
        }

        if (lastProcessed !== r.lastProcessedDate) {
          return { ...r, lastProcessedDate: lastProcessed };
        }
        return r;
      })
    );

    return anyProcessed;
  }, [addTransaction, setRecurringList]);

  return {
    recurringList,
    setRecurringList,
    addRecurring,
    removeRecurring,
    toggleRecurring,
    clearRecurring,
    processDueTransactions,
  };
}
