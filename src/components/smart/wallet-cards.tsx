"use client";

import { BanknoteIcon, ChevronDownIcon, ChevronUpIcon, SettingsIcon, WalletIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTracker } from "@/context/tracker-context";
import { formatCurrency } from "@/lib/utils";
import type { WalletType } from "@/types/transaction";

export const WALLET_TYPE_ICON: Record<WalletType, typeof WalletIcon> = {
  cash: BanknoteIcon,
  "e-wallet-card": WalletIcon,
};

/** Home: a card per wallet (balance, income, spending) and the Manage button. */
export default function WalletCards() {
  const { data, dialogs } = useTracker();
  const { wallets, walletBalances } = data;
  const columns = wallets.length === 1 ? "sm:grid-cols-1" : wallets.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";

  return (
    <>
      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Wallets</h2>
        <Button
          variant="outline"
          size="icon-sm"
          className="max-md:size-10"
          aria-label="Manage wallets"
          onClick={() => dialogs.setWalletsOpen(true)}
        >
          <SettingsIcon className="size-4" />
        </Button>
      </div>
      <div className={`grid grid-cols-1 gap-3 ${columns}`}>
        {wallets.map((wallet) => {
          const balance = walletBalances[wallet.id] ?? { balance: 0, income: 0, expenses: 0 };
          const Icon = WALLET_TYPE_ICON[wallet.type] ?? WalletIcon;
          return (
            <div key={wallet.id} className="flex flex-col gap-1 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-4" />
                <span className="truncate text-xs font-medium">{wallet.name}</span>
              </div>
              <div className="font-mono text-lg font-bold">{formatCurrency(balance.balance)}</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-mono text-xs text-emerald-600 md:text-[10px] dark:text-emerald-400">
                  <ChevronUpIcon className="mr-1 inline-block size-3" />
                  {formatCurrency(balance.income)}
                </span>
                <span className="font-mono text-xs text-red-600 md:text-[10px] dark:text-red-400">
                  <ChevronDownIcon className="mr-1 inline-block size-3" />
                  {formatCurrency(balance.expenses)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
