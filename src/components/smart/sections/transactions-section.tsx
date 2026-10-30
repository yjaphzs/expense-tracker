"use client";

import { PlusIcon } from "lucide-react";

import { FilteredTransactions } from "@/components/smart/filters/filtered-transactions";
import { NoWalletsEmpty, SectionEmpty } from "@/components/smart/sections/section-empty";
import { Button } from "@/components/ui/button";
import { useTracker } from "@/context/tracker-context";
import type { TransactionType } from "@/types/transaction";

const COPY = {
  income: {
    title: "Income",
    add: "Add Income",
    emptyTitle: "No income yet",
    emptyText: "Add your first income transaction to start tracking your earnings.",
    search: "Search income",
  },
  expense: {
    title: "Expenses",
    add: "Add Expense",
    emptyTitle: "No expenses yet",
    emptyText: "Add your first expense to start tracking your spending.",
    search: "Search expenses",
  },
};

/** The Income or Expenses section: one type, transfers left out. */
export function TransactionsSection({ type }: { type: TransactionType }) {
  const { data, dialogs } = useTracker();
  const copy = COPY[type];
  const list = data.getFilteredTransactions(type);
  const add = () => dialogs.openEntry(type);

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        {data.wallets.length > 0 && list.length > 0 && (
          <Button variant="outline" size="sm" className="max-md:hidden" onClick={add}>
            <PlusIcon className="size-4" />
            {copy.add}
          </Button>
        )}
      </div>
      {data.wallets.length === 0 ? (
        <NoWalletsEmpty />
      ) : list.length === 0 ? (
        <SectionEmpty title={copy.emptyTitle} description={copy.emptyText} actionLabel={copy.add} onAction={add} />
      ) : (
        <FilteredTransactions transactions={list} type={type} placeholder={copy.search} />
      )}
    </>
  );
}
