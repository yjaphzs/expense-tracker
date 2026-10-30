import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Trash2Icon,
  WalletIcon,
  PencilIcon,
  ArrowLeftRightIcon,
  ChevronRightIcon,
} from "lucide-react";
import { TransactionActionSheet } from "@/components/smart/transaction-action-sheet";
import { getCategoryIcon } from "@/lib/category-icons";
import type { Transaction, Wallet } from "@/types/transaction";
import { isTransfer } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";
import Paginator from "@/components/smart/paginator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

interface TransactionListProps {
  transactions: Transaction[];
  wallets: Wallet[];
  /** Deletes right away; the caller offers Undo (a transfer goes with its other leg). */
  onRemove: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  wallets,
  onRemove,
  onEdit,
}) => {
  const walletMap = Object.fromEntries(wallets.map((w) => [w.id, w.name]));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  // Phones: tapping a row opens its action sheet. The tapped row outlives
  // `sheetOpen` so the sheet keeps its content while it animates closed.
  const [tapped, setTapped] = useState<Transaction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Sort all transactions by date descending, then paginate
  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  const totalPages = Math.ceil(sorted.length / pageSize);

  // Reset page if it goes out of bounds
  const safePage = Math.min(currentPage, totalPages || 1);
  if (safePage !== currentPage) setCurrentPage(safePage);

  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize]
  );

  if (transactions.length === 0) {
    return (
      <Empty className="mt-4">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WalletIcon />
          </EmptyMedia>
          <EmptyTitle>No transactions yet</EmptyTitle>
          <EmptyDescription>
            Add your first income or expense to get started.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // Group the paged transactions by date
  const grouped = paged.reduce<Record<string, Transaction[]>>(
    (acc, t) => {
      const key = t.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Show</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            setPageSize(Number(v));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[76px] text-sm md:h-7 md:w-[70px] md:text-xs" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>per page</span>
      </div>
      {sortedDates.map((date) => (
        <div key={date} className="flex flex-col gap-2">
          <div className="text-xs font-medium text-muted-foreground/60 tracking-wider">
            {formatDate(date)}
          </div>
          <div className="flex flex-col gap-2">
            {grouped[date].map((t) => {
              const transfer = isTransfer(t);
              return (
              <div
                key={t.id}
                className="relative flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
              >
                <div
                  className={`flex items-center justify-center size-9 rounded-full shrink-0 ${
                    transfer
                      ? "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400"
                      : t.type === "income"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                  }`}
                >
                  {transfer
                    ? <ArrowLeftRightIcon className="size-4" />
                    : (() => { const Icon = getCategoryIcon(t.category); return <Icon className="size-4" />; })()}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {t.description || t.category}
                    </span>
                    <Badge variant="outline" className="hidden shrink-0 text-[10px] sm:inline-flex">
                      {t.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {t.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {t.category}
                      </span>
                    )}
                    {walletMap[t.walletId] && (
                      <span className="text-xs text-muted-foreground/60 md:text-[10px]">
                        {t.description ? " · " : ""}{walletMap[t.walletId]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-sm font-mono font-bold ${
                      transfer
                        ? "text-sky-600 dark:text-sky-400"
                        : t.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                  <ChevronRightIcon aria-hidden className="size-5 text-muted-foreground md:hidden" />
                  <ButtonGroup className="hidden md:flex">
                    {onEdit && !transfer && (
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Edit ${t.description || t.category}`}
                        onClick={() => onEdit(t)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      aria-label={`Delete ${t.description || t.category}`}
                      onClick={() => onRemove(t)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </ButtonGroup>
                </div>
                {/* Over the whole row on phones, where the inline buttons are hidden. */}
                <button
                  type="button"
                  aria-label={`Actions for ${t.description || t.category}`}
                  onClick={() => {
                    setTapped(t);
                    setSheetOpen(true);
                  }}
                  className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:bg-foreground/5 md:hidden"
                />
              </div>
              );
            })}
          </div>
        </div>
      ))}
      <Paginator
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      <TransactionActionSheet
        transaction={tapped}
        walletName={tapped ? walletMap[tapped.walletId] : undefined}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        // A transfer is edited by deleting it and making a new one: editing one
        // leg on its own would turn it into plain income or expense.
        onEdit={tapped && isTransfer(tapped) ? undefined : onEdit}
        onRemove={onRemove}
      />
    </div>
  );
};

export default TransactionList;
