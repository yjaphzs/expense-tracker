"use client";

import { useMemo, useState } from "react";
import { SearchXIcon } from "lucide-react";

import TransactionList from "@/components/smart/transaction-list";
import { TransactionFilterBar } from "@/components/smart/filters/transaction-filter-bar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useTracker } from "@/context/tracker-context";
import { categoryNames } from "@/lib/categories";
import { applyFilter, EMPTY_FILTER } from "@/lib/transaction-filters";
import type { Transaction, TransactionType } from "@/types/transaction";
import { TRANSFER_CATEGORY } from "@/types/transaction";

interface FilteredTransactionsProps {
  transactions: Transaction[];
  /** Income or Expenses section; omitted on Home (both, plus transfers). */
  type?: TransactionType;
  placeholder: string;
}

/** A searchable, filterable transaction list. Each section keeps its own filters. */
export function FilteredTransactions({ transactions, type, placeholder }: FilteredTransactionsProps) {
  const { data } = useTracker();
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const results = useMemo(() => applyFilter(transactions, filter, data.wallets), [transactions, filter, data.wallets]);
  const categories = useMemo(
    () =>
      type
        ? categoryNames(type, data.categories)
        : [...new Set([...categoryNames("expense", data.categories), ...categoryNames("income", data.categories), TRANSFER_CATEGORY])],
    [type, data.categories],
  );

  return (
    <>
      <TransactionFilterBar
        filter={filter}
        onChange={setFilter}
        categories={categories}
        wallets={data.wallets}
        results={results}
        placeholder={placeholder}
      />
      {results.length > 0 ? (
        <TransactionList transactions={results} />
      ) : (
        <Empty className="mt-4 border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>No matches</EmptyTitle>
            <EmptyDescription>Try a different search or fewer filters.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => setFilter(EMPTY_FILTER)}>
              Clear filters
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </>
  );
}
