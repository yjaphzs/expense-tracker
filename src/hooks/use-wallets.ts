import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Wallet, Transaction } from "@/types/transaction";
import { isTransfer } from "@/types/transaction";

/**
 * Derived wallet helpers over lifted state. The state itself lives in
 * `useExpenseData`; this hook provides the add/remove logic and the per-wallet
 * balance map.
 */
export function useWalletLogic(
  wallets: Wallet[],
  setWallets: Dispatch<SetStateAction<Wallet[]>>,
  transactions: Transaction[],
) {
  const addWallet = useCallback(
    (name: string, type: Wallet["type"]) => {
      const id = crypto.randomUUID();
      setWallets((prev) => [...prev, { id, name: name.trim(), type }]);
    },
    [setWallets],
  );

  const removeWallet = useCallback(
    (id: string) => {
      setWallets((prev) => prev.filter((w) => w.id !== id));
    },
    [setWallets],
  );

  const walletBalances = useMemo(() => {
    const map: Record<
      string,
      { income: number; expenses: number; balance: number }
    > = {};
    for (const w of wallets) {
      map[w.id] = { income: 0, expenses: 0, balance: 0 };
    }
    for (const t of transactions) {
      if (!map[t.walletId]) {
        map[t.walletId] = { income: 0, expenses: 0, balance: 0 };
      }
      // Balance always reflects the movement (transfers really move money
      // between wallets). The income/expenses indicators exclude transfer legs,
      // since a transfer isn't this wallet's income or spending.
      const transfer = isTransfer(t);
      if (t.type === "income") {
        map[t.walletId].balance += t.amount;
        if (!transfer) map[t.walletId].income += t.amount;
      } else {
        map[t.walletId].balance -= t.amount;
        if (!transfer) map[t.walletId].expenses += t.amount;
      }
    }
    return map;
  }, [wallets, transactions]);

  return {
    addWallet,
    removeWallet,
    walletBalances,
  };
}
