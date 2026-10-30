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

  const editWallet = useCallback(
    (id: string, changes: Pick<Wallet, "name" | "type">) => {
      setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, name: changes.name.trim(), type: changes.type } : w)));
    },
    [setWallets],
  );

  /** Moves a wallet one place up (-1) or down (+1); wallets show in this order everywhere. */
  const moveWallet = useCallback(
    (id: string, delta: -1 | 1) => {
      setWallets((prev) => {
        const from = prev.findIndex((w) => w.id === id);
        const to = from + delta;
        if (from < 0 || to < 0 || to >= prev.length) return prev;
        const next = [...prev];
        [next[from], next[to]] = [next[to], next[from]];
        return next;
      });
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
    editWallet,
    moveWallet,
    walletBalances,
  };
}
