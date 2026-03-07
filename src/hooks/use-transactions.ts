import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Transaction, TransactionType } from "@/types/transaction";

export function useTransactions(storageKey = "expense-tracker-transactions", autosave = true) {
  const [transactions, setTransactions, removeTransactions] = useLocalStorage<Transaction[]>(
    storageKey,
    [],
    { enabled: autosave }
  );

  const addTransaction = useCallback((
    data: Omit<Transaction, "id">
  ) => {
    const newTransaction: Transaction = {
      ...data,
      id: crypto.randomUUID(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  }, [setTransactions]);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, [setTransactions]);

  const editTransaction = useCallback((id: string, data: Omit<Transaction, "id">) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...data, id } : t))
    );
  }, [setTransactions]);

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

  const getFilteredTransactions = (type?: TransactionType) => {
    if (!type) return transactions;
    return transactions.filter((t) => t.type === type);
  };

  return {
    transactions,
    setTransactions,
    removeTransactions,
    addTransaction,
    removeTransaction,
    editTransaction,
    summary,
    getFilteredTransactions,
  };
}
