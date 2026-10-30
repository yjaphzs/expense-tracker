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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ResponsiveMenu } from "@/components/shared/responsive-menu";
import type { MenuGroup } from "@/components/shared/menu-types";
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
  ChevronRightIcon,
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
  // One confirmation for the list; kept while the dialog animates closed.
  const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
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

  // The same actions as a dropdown (desktop "⋯") and a sheet (tapping a row on phones).
  const menuGroups = (r: RecurringTransaction): MenuGroup[] => [
    {
      id: "actions",
      items: [
        ...(onEdit
          ? [{ kind: "action" as const, id: "edit", label: "Edit", icon: PencilIcon, onSelect: () => onEdit(r) }]
          : []),
        {
          kind: "action",
          id: "toggle",
          label: r.enabled ? "Pause" : "Resume",
          icon: r.enabled ? PauseIcon : PlayIcon,
          onSelect: () => onToggle(r.id),
        },
        {
          kind: "action",
          id: "delete",
          label: "Delete",
          icon: Trash2Icon,
          destructive: true,
          onSelect: () => {
            setDeleteTarget(r);
            setDeleteOpen(true);
          },
        },
      ],
    },
  ];

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
        <SelectTrigger aria-label="Rows per page" className="h-9 w-[76px] text-sm md:h-7 md:w-[70px] md:text-xs">
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
          className={`relative ${r.enabled ? "" : "opacity-50"}`}
        >
          <div className="flex items-center w-full">
            <ItemContent>
              <ItemTitle className="line-clamp-1 text-muted-foreground text-xs">
                <Badge
                  variant={r.type === "income" ? "secondary" : "outline"}
                  className="text-xs md:text-[10px]"
                >
                  {(() => { const Icon = getCategoryIcon(r.category); return <Icon className="size-3" />; })()}
                  {r.category}
                </Badge>
                <Badge variant="outline" className="text-xs md:text-[10px]">
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
              <ChevronRightIcon aria-hidden className="size-5 text-muted-foreground md:hidden" />
              <div className="hidden md:block">
                <ResponsiveMenu
                  mode="menu"
                  align="end"
                  title={r.description || r.category}
                  groups={menuGroups(r)}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`More options for ${r.description || r.category}`}>
                      <MoreHorizontalIcon />
                    </Button>
                  }
                />
              </div>
            </ItemActions>
            {/* Over the whole row on phones: opens the same actions as a sheet. */}
            <div className="md:hidden">
              <ResponsiveMenu
                mode="sheet"
                title={r.description || r.category}
                description={`${formatCurrency(r.amount)} · ${FREQUENCY_LABELS[r.frequency]} · ${r.enabled ? "Active" : "Paused"}`}
                groups={menuGroups(r)}
                trigger={
                  <button
                    type="button"
                    aria-label={`Actions for ${r.description || r.category}`}
                    className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:bg-foreground/5"
                  />
                }
              />
            </div>
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
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <Trash2Icon className="size-10 border rounded-lg bg-primary text-primary-foreground p-2 mx-auto sm:mx-0" />
          <AlertDialogTitle>Delete this recurring transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteTarget && (
              <>
                This will stop future automatic transactions for{" "}
                <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
                  {formatCurrency(deleteTarget.amount)} ({deleteTarget.category},{" "}
                  {FREQUENCY_LABELS[deleteTarget.frequency]})
                </code>
                . Previously created transactions will remain.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (deleteTarget) onRemove(deleteTarget.id);
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default RecurringList;
