import React, { useState, useMemo } from "react";
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
  RepeatIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  PencilIcon,
} from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatCurrency } from "@/lib/utils";
import type { RecurringTransaction } from "@/types/transaction";
import Paginator from "@/components/smart/paginator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
};

interface RecurringListProps {
  items: RecurringTransaction[];
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onEdit?: (item: RecurringTransaction) => void;
}

const RecurringList: React.FC<RecurringListProps> = ({
  items,
  onRemove,
  onToggle,
  onEdit,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalPages = Math.ceil(items.length / pageSize);
  const safePage = Math.min(currentPage, totalPages || 1);
  if (safePage !== currentPage) setCurrentPage(safePage);

  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  if (items.length === 0) {
    return (
      <Empty className="mt-4 border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RepeatIcon />
          </EmptyMedia>
          <EmptyTitle>No recurring transactions</EmptyTitle>
          <EmptyDescription>
            Set up automatic income or expenses that repeat on a schedule.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
      <span>Show</span>
      <Select
        value={String(pageSize)}
        onValueChange={(v) => {
          setPageSize(Number(v));
          setCurrentPage(1);
        }}
      >
        <SelectTrigger className="h-7 w-[70px] text-xs">
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
    <ItemGroup className="gap-2 mt-4">
      {paged.map((r) => (
        <Item
          key={r.id}
          variant="outline"
          size="sm"
          asChild
          role="listitem"
          className={r.enabled ? "" : "opacity-50"}
        >
          <div className="flex items-center w-full">
            <ItemContent>
              <ItemTitle className="line-clamp-1 text-muted-foreground text-xs">
                <Badge
                  variant={r.type === "income" ? "secondary" : "outline"}
                  className="text-[10px]"
                >
                  {(() => { const Icon = getCategoryIcon(r.category); return <Icon className="size-3" />; })()}
                  {r.category}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {FREQUENCY_LABELS[r.frequency]}
                </Badge>
              </ItemTitle>
              <ItemDescription className="text-sm font-semibold line-clamp-1 text-foreground">
                {r.description || r.category}
              </ItemDescription>
            </ItemContent>
            <ItemContent>
              <ItemTitle className="line-clamp-1 text-muted-foreground w-full text-end text-xs">
                {r.enabled ? "Active" : "Paused"}
              </ItemTitle>
              <ItemDescription
                className={`text-base font-bold line-clamp-1 font-mono w-full text-end ${
                  r.type === "income"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-700 dark:text-rose-400"
                }`}
              >
                {r.type === "income" ? "+" : "-"}
                {formatCurrency(r.amount)}
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
                    {onEdit && (
                      <DropdownMenuItem onSelect={() => onEdit(r)}>
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onSelect={() => onToggle(r.id)}
                    >
                      {r.enabled ? (
                        <>
                          <PauseIcon className="w-4 h-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-4 h-4" />
                          Resume
                        </>
                      )}
                    </DropdownMenuItem>
                    <AlertDialog
                      open={deleteDialogOpen === r.id}
                      onOpenChange={(open) => {
                        if (!open) setDeleteDialogOpen(null);
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={(e) => {
                            e.preventDefault();
                            setDeleteDialogOpen(r.id);
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
                            Delete this recurring transaction?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will stop future automatic transactions for{" "}
                            <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
                              {formatCurrency(r.amount)} ({r.category} —{" "}
                              {FREQUENCY_LABELS[r.frequency]})
                            </code>
                            . Previously created transactions will remain.
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
                              onRemove(r.id);
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
    <div className="mt-4">
      <Paginator
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
    </>
  );
};

export default RecurringList;
