"use client";

import { useMemo, useState } from "react";

import Paginator from "@/components/smart/paginator";
import { PageSizeSelect } from "@/components/smart/page-size-select";
import { TransactionActionSheet } from "@/components/smart/transaction-action-sheet";
import { TransactionRow } from "@/components/smart/transaction-row";
import { useTracker } from "@/context/tracker-context";
import type { Transaction } from "@/types/transaction";

const formatDay = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/** Newest first, paginated, grouped by day. Edit and Delete act through the tracker's actions. */
export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const { data, actions } = useTracker();
  const walletName = useMemo(() => Object.fromEntries(data.wallets.map((w) => [w.id, w.name])), [data.wallets]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  // Phones: tapping a row opens its action sheet. The tapped row outlives
  // `sheetOpen` so the sheet keeps its content while it animates closed.
  const [tapped, setTapped] = useState<Transaction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sorted = useMemo(() => [...transactions].sort((a, b) => b.date.localeCompare(a.date)), [transactions]);
  const totalPages = Math.ceil(sorted.length / pageSize);
  const page = Math.min(currentPage, totalPages || 1);
  if (page !== currentPage) setCurrentPage(page);

  const days = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const t of sorted.slice((page - 1) * pageSize, page * pageSize)) {
      groups.set(t.date, [...(groups.get(t.date) ?? []), t]);
    }
    return [...groups.entries()];
  }, [sorted, page, pageSize]);

  return (
    <div className="mt-4 flex flex-col gap-6">
      <PageSizeSelect
        value={pageSize}
        onChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />
      {days.map(([date, items]) => (
        <div key={date} className="flex flex-col gap-2">
          <div className="text-xs font-medium tracking-wider text-muted-foreground/60">{formatDay(date)}</div>
          {items.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              walletName={walletName[t.walletId]}
              onEdit={actions.openEdit}
              onRemove={actions.deleteTransaction}
              onTap={(row) => {
                setTapped(row);
                setSheetOpen(true);
              }}
            />
          ))}
        </div>
      ))}
      <Paginator currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage} />
      <TransactionActionSheet
        transaction={tapped}
        walletName={tapped ? walletName[tapped.walletId] : undefined}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onEdit={actions.openEdit}
        onRemove={actions.deleteTransaction}
      />
    </div>
  );
}
