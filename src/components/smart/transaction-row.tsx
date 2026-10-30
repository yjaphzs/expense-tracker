"use client";

import { ArrowLeftRightIcon, ChevronRightIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { CategoryIcon } from "@/components/smart/category-icon";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";
import { isTransfer } from "@/types/transaction";

interface TransactionRowProps {
  transaction: Transaction;
  walletName?: string;
  onEdit: (t: Transaction) => void;
  onRemove: (t: Transaction) => void;
  /** Phones: the whole row opens the action sheet. */
  onTap: (t: Transaction) => void;
}

const TONE = {
  transfer: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  income: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  expense: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
};
const AMOUNT = {
  transfer: "text-sky-600 dark:text-sky-400",
  income: "text-emerald-600 dark:text-emerald-400",
  expense: "text-red-600 dark:text-red-400",
};

export function TransactionRow({ transaction: t, walletName, onEdit, onRemove, onTap }: TransactionRowProps) {
  const tone = isTransfer(t) ? "transfer" : t.type;
  const name = t.description || t.category;

  return (
    <div className="relative flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${TONE[tone]}`}>
        {tone === "transfer" ? <ArrowLeftRightIcon className="size-4" /> : <CategoryIcon name={t.category} className="size-4" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{name}</span>
          <Badge variant="outline" className="hidden shrink-0 text-[10px] sm:inline-flex">
            {t.category}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {t.description && <span className="truncate text-xs text-muted-foreground">{t.category}</span>}
          {walletName && (
            <span className="text-xs text-muted-foreground/60 md:text-[10px]">
              {t.description ? " · " : ""}
              {walletName}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`font-mono text-sm font-bold ${AMOUNT[tone]}`}>
          {t.type === "income" ? "+" : "-"}
          {formatCurrency(t.amount)}
        </span>
        <ChevronRightIcon aria-hidden className="size-5 text-muted-foreground md:hidden" />
        <ButtonGroup className="hidden md:flex">
          <Button variant="outline" size="icon-sm" aria-label={`Edit ${name}`} onClick={() => onEdit(t)}>
            <PencilIcon className="size-3.5" />
          </Button>
          <Button variant="destructive" size="icon-sm" aria-label={`Delete ${name}`} onClick={() => onRemove(t)}>
            <Trash2Icon className="size-3.5" />
          </Button>
        </ButtonGroup>
      </div>
      {/* Over the whole row on phones, where the inline buttons are hidden. */}
      <button
        type="button"
        aria-label={`Actions for ${name}`}
        onClick={() => onTap(t)}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:bg-foreground/5 md:hidden"
      />
    </div>
  );
}
