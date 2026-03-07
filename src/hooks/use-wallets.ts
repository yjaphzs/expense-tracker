import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Wallet, Transaction } from "@/types/transaction";
import { DEFAULT_WALLETS } from "@/types/transaction";

export function useWallets(transactions: Transaction[], storageKey = "expense-tracker-wallets", autosave = true) {
  const [wallets, setWallets, removeWallets] = useLocalStorage<Wallet[]>(
    storageKey,
    DEFAULT_WALLETS,
    { enabled: autosave }
  );

  const addWallet = (name: string, type: Wallet["type"]) => {
    const id = crypto.randomUUID();
    setWallets((prev) => [...prev, { id, name: name.trim(), type }]);
  };

  const removeWallet = (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
  };

  const walletBalances = useMemo(() => {
    const map: Record<string, { income: number; expenses: number; balance: number }> = {};
    for (const w of wallets) {
      map[w.id] = { income: 0, expenses: 0, balance: 0 };
    }
    for (const t of transactions) {
      if (!map[t.walletId]) {
        map[t.walletId] = { income: 0, expenses: 0, balance: 0 };
      }
      if (t.type === "income") {
        map[t.walletId].income += t.amount;
        map[t.walletId].balance += t.amount;
      } else {
        map[t.walletId].expenses += t.amount;
        map[t.walletId].balance -= t.amount;
      }
    }
    return map;
  }, [wallets, transactions]);

  return {
    wallets,
    setWallets,
    removeWallets,
    addWallet,
    removeWallet,
    walletBalances,
  };
}
