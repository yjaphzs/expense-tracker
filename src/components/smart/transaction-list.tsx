import React, { useState } from "react";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontalIcon,
} from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

interface TransactionListProps {
  transactions: Transaction[];
  onRemove: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onRemove,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <Empty className="mt-4 border border-dashed">
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
          <div className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
            {formatDate(date)}
          </div>
          <ItemGroup className="gap-2">
            {grouped[date].map((t) => (
              <Item key={t.id} variant="outline" size="sm" asChild role="listitem">
                <div className="flex items-center w-full">
                  <ItemContent>
                    <ItemTitle className="line-clamp-1 text-muted-foreground text-xs">
                      <Badge
                        variant={t.type === "income" ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {(() => { const Icon = getCategoryIcon(t.category); return <Icon className="size-3" />; })()}
                        {t.category}
                      </Badge>
                    </ItemTitle>
                    <ItemDescription className="text-sm font-semibold line-clamp-1 text-foreground">
                      {t.description || t.category}
                    </ItemDescription>
                  </ItemContent>
                  <ItemContent>
                    <ItemTitle className="line-clamp-1 text-muted-foreground w-full text-end text-xs">
                      {t.type === "income" ? "Income" : "Expense"}
                    </ItemTitle>
                    <ItemDescription
                      className={`text-base font-bold line-clamp-1 font-mono w-full text-end ${
                        t.type === "income"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="More Options"
                        >
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuGroup>
                          <AlertDialog
                            open={deleteDialogOpen === t.id}
                            onOpenChange={(open) => {
                              if (!open) setDeleteDialogOpen(null);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setDeleteDialogOpen(t.id);
                                }}
                              >
                                <Trash2Icon className="w-4 h-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <Trash2Icon className="size-10 border rounded-lg bg-primary text-primary-foreground p-2 mx-auto sm:mx-0" />
                                <AlertDialogTitle>
                                  Delete this transaction?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently remove this {t.type} of{" "}
                                  <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
                                    {formatCurrency(t.amount)} ({t.category})
                                  </code>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  onClick={() => setDeleteDialogOpen(null)}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    onRemove(t.id);
                                    setDeleteDialogOpen(null);
                                  }}
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ItemActions>
                </div>
              </Item>
            ))}
          </ItemGroup>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
