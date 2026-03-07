import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
} from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import type { Transaction, Wallet } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";

interface TransactionListProps {
  transactions: Transaction[];
  wallets: Wallet[];
  onRemove: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  wallets,
  onRemove,
  onEdit,
}) => {
  const walletMap = Object.fromEntries(wallets.map((w) => [w.id, w.name]));
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

  // Group transactions by date
  const grouped = transactions.reduce<Record<string, Transaction[]>>(
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
      {sortedDates.map((date) => (
        <div key={date} className="flex flex-col gap-2">
          <div className="text-xs font-medium text-muted-foreground/60 tracking-wider">
            {formatDate(date)}
          </div>
          <div className="flex flex-col gap-2">
            {grouped[date].map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
              >
                <div
                  className={`flex items-center justify-center size-9 rounded-full shrink-0 ${
                    t.type === "income"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                  }`}
                >
                  {(() => { const Icon = getCategoryIcon(t.category); return <Icon className="size-4" />; })()}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {t.description || t.category}
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
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
                      <span className="text-[10px] text-muted-foreground/60">
                        {t.description ? " · " : ""}{walletMap[t.walletId]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-sm font-mono font-bold ${
                      t.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                  <ButtonGroup>
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => onEdit(t)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon-sm">
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this {t.type} of{" "}
                            <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
                              {formatCurrency(t.amount)}
                            </code>{" "}
                            <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
                              ({t.category})
                            </code>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onRemove(t.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </ButtonGroup>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
