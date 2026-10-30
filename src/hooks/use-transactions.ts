import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Transaction, TransactionType } from "@/types/transaction";
import { isTransfer, transferPartner } from "@/types/transaction";

/**
 * Derived transaction helpers over lifted state. The state itself lives in
 * `useExpenseData` (guest localStorage or signed-in cloud); this hook only
 * provides the mutation + selector logic.
 */
export function useTransactionLogic(
  transactions: Transaction[],
  setTransactions: Dispatch<SetStateAction<Transaction[]>>,
) {
  const addTransaction = useCallback(
    (data: Omit<Transaction, "id">) => {
      const newTransaction: Transaction = {
        ...data,
        id: crypto.randomUUID(),
      };
      setTransactions((prev) => [newTransaction, ...prev]);
    },
    [setTransactions],
  );

  /**
   * Removes a transaction (both legs, for a transfer) and returns what was
   * removed so the caller can offer Undo with `restoreTransactions`.
   */
  const removeTransaction = useCallback(
    (id: string): Transaction[] => {
      const target = transactions.find((t) => t.id === id);
      if (!target) return [];
      const partner = transferPartner(transactions, target);
      const removed = partner ? [target, partner] : [target];
      const ids = new Set(removed.map((t) => t.id));
      setTransactions((prev) => prev.filter((t) => !ids.has(t.id)));
      return removed;
    },
    [transactions, setTransactions],
  );

  /** Puts back transactions removed by `removeTransaction` (Undo). */
  const restoreTransactions = useCallback(
    (items: Transaction[]) => {
      setTransactions((prev) => {
        const present = new Set(prev.map((t) => t.id));
        return [...items.filter((t) => !present.has(t.id)), ...prev];
      });
    },
    [setTransactions],
  );

  const editTransaction = useCallback(
    (id: string, data: Omit<Transaction, "id">) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...data, id } : t)),
      );
    },
    [setTransactions],
  );

  const summary = useMemo(() => {
    // Transfers move money between your own wallets — they aren't income or
    // spending, so they're excluded from these totals.
    const income = transactions
      .filter((t) => t.type === "income" && !isTransfer(t))
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === "expense" && !isTransfer(t))
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  const getFilteredTransactions = useCallback(
    (type?: TransactionType) => {
      // No type → the full list (Home "Recent Transactions" shows transfers too,
      // styled neutrally). The Income/Expense tabs exclude transfer legs.
      if (!type) return transactions;
      return transactions.filter((t) => t.type === type && !isTransfer(t));
    },
    [transactions],
  );

  return {
    addTransaction,
    removeTransaction,
    restoreTransactions,
    editTransaction,
    summary,
    getFilteredTransactions,
  };
}
