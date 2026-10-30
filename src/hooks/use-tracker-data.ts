"use client";

import { useEffect, useRef } from "react";

import { useExpenseData } from "@/hooks/use-expense-data";
import { useRecurringLogic } from "@/hooks/use-recurring-transactions";
import { useTransactionLogic } from "@/hooks/use-transactions";
import { useWalletLogic } from "@/hooks/use-wallets";

/** The tracker's data plus the logic over it: one object for the whole page. */
export function useTrackerData() {
  const data = useExpenseData();
  const transactions = useTransactionLogic(data.transactions, data.setTransactions);
  const recurring = useRecurringLogic(data.recurring, data.setRecurring, transactions.addTransaction);
  const wallets = useWalletLogic(data.wallets, data.setWallets, data.transactions);

  // Add due recurring transactions once, after the real data has loaded (guest
  // storage or the first cloud snapshot), never against the empty initial state.
  const processedRef = useRef(false);
  const { loading } = data;
  const { processDueTransactions } = recurring;
  useEffect(() => {
    if (loading || processedRef.current) return;
    processedRef.current = true;
    processDueTransactions();
  }, [loading, processDueTransactions]);

  return { ...data, ...transactions, ...recurring, ...wallets };
}

export type TrackerData = ReturnType<typeof useTrackerData>;
