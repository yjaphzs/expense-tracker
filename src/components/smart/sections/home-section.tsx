"use client";

import { useState } from "react";
import { ArrowLeftRightIcon } from "lucide-react";

import { InstallBanner } from "@/components/shared/install-banner";
import BalanceSummary from "@/components/smart/balance-summary";
import { BudgetsCard } from "@/components/smart/budgets/budgets-card";
import DataToolbar from "@/components/smart/data-toolbar";
import { FilteredTransactions } from "@/components/smart/filters/filtered-transactions";
import { FirstTransactionHint } from "@/components/smart/onboarding/first-transaction-hint";
import { OnboardingCard } from "@/components/smart/onboarding/onboarding-card";
import WalletCards from "@/components/smart/wallet-cards";
import { Button } from "@/components/ui/button";
import { useTracker } from "@/context/tracker-context";
import { isOnboarded } from "@/lib/onboarding";
import { hasData } from "@/lib/tracker-state";

/** Balance, wallets, budgets, then every transaction (searchable). First run shows onboarding instead. */
export function HomeSection() {
  const { data, dialogs } = useTracker();
  const [onboarded, setOnboarded] = useState(isOnboarded);
  // First run: an empty tracker (a lone default Cash wallet doesn't count), or no wallets at all.
  const firstRun = data.wallets.length === 0 || (!onboarded && !hasData(data));

  return (
    <>
      <InstallBanner />
      <BalanceSummary balance={data.summary.balance} income={data.summary.income} expenses={data.summary.expenses} />
      {firstRun ? (
        <OnboardingCard onDone={() => setOnboarded(true)} />
      ) : (
        <>
          <WalletCards />
          {data.wallets.length >= 2 && (
            <div className="mt-4">
              <Button variant="outline" size="sm" className="max-md:h-10" onClick={() => dialogs.openTransfer()}>
                <ArrowLeftRightIcon className="size-4" /> Transfer Between Wallets
              </Button>
            </div>
          )}
          <BudgetsCard />
          <div className="mt-6 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <DataToolbar />
          </div>
          {data.transactions.length === 0 ? (
            <FirstTransactionHint />
          ) : (
            <FilteredTransactions transactions={data.transactions} placeholder="Search transactions" />
          )}
        </>
      )}
    </>
  );
}
