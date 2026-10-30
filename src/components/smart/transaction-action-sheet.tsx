"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatCurrency } from "@/lib/utils";
import { isTransfer, type Transaction } from "@/types/transaction";

interface TransactionActionSheetProps {
  /** The last tapped transaction; kept while the sheet animates closed. */
  transaction: Transaction | null;
  walletName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (transaction: Transaction) => void;
  onRemove: (transaction: Transaction) => void;
}

function Fact({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={className ?? "text-sm font-medium"}>{value}</span>
    </div>
  );
}

/** Phone-only sheet opened by tapping a transaction row: details, then Edit or Delete. */
export function TransactionActionSheet({
  transaction: t,
  walletName,
  open,
  onOpenChange,
  onEdit,
  onRemove,
}: TransactionActionSheetProps) {
  if (!t) return null;
  const transfer = isTransfer(t);
  const date = new Date(`${t.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function run(action: (transaction: Transaction) => void) {
    if (!t) return;
    onOpenChange(false);
    action(t);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerDescription>{transfer ? "Transfer" : t.category}</DrawerDescription>
          <DrawerTitle className="text-lg">{t.description || t.category}</DrawerTitle>
        </DrawerHeader>
        <div className="grid grid-cols-2 gap-2 px-4">
          <Fact
            label="Amount"
            value={`${t.type === "income" ? "+" : "-"}${formatCurrency(t.amount)}`}
            className={`font-mono text-lg font-bold ${
              transfer
                ? "text-sky-600 dark:text-sky-400"
                : t.type === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
            }`}
          />
          <Fact label="Date" value={date} />
          {walletName && <Fact label="Wallet" value={walletName} />}
          <Fact label="Type" value={transfer ? "Transfer" : t.type === "income" ? "Income" : "Expense"} />
        </div>
        {transfer && (
          <p className="px-4 pt-2 text-sm text-muted-foreground">
            Deleting removes both sides of this transfer.
          </p>
        )}
        <DrawerFooter>
          {onEdit && (
            <Button className="h-11" onClick={() => run(onEdit)}>
              <PencilIcon className="size-4" />
              Edit
            </Button>
          )}
          <Button variant="destructive" className="h-11" onClick={() => run(onRemove)}>
            <Trash2Icon className="size-4" />
            {transfer ? "Delete transfer" : "Delete"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="h-11">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
