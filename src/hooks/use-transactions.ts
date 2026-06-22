import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Transaction, TransactionType } from "@/types/transaction";

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

  const removeTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
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
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  const getFilteredTransactions = useCallback(
    (type?: TransactionType) => {
      if (!type) return transactions;
      return transactions.filter((t) => t.type === type);
    },
    [transactions],
  );

  return {
    addTransaction,
    removeTransaction,
    editTransaction,
    summary,
    getFilteredTransactions,
  };
}
