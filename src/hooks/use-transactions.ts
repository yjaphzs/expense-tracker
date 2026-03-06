import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Transaction, TransactionType } from "@/types/transaction";

export const TRANSACTIONS_STORAGE_KEY = "expense-tracker-transactions";

export function useTransactions(autosave = true) {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    TRANSACTIONS_STORAGE_KEY,
    [],
    { enabled: autosave }
  );

  const addTransaction = (
    data: Omit<Transaction, "id">
  ) => {
    const newTransaction: Transaction = {
      ...data,
      id: crypto.randomUUID(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const removeTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

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
    addTransaction,
    removeTransaction,
    clearTransactions,
    summary,
    getFilteredTransactions,
  };
}
