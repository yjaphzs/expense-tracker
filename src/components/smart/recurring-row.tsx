"use client";

import { ChevronRightIcon, MoreHorizontalIcon, PauseIcon, PencilIcon, PlayIcon, Trash2Icon } from "lucide-react";

import type { MenuGroup } from "@/components/shared/menu-types";
import { ResponsiveMenu } from "@/components/shared/responsive-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { CategoryIcon } from "@/components/smart/category-icon";
import { useTracker } from "@/context/tracker-context";
import { FREQUENCY_LABELS, nextDueDate, parseLocalDate } from "@/lib/recurring-schedule";
import { formatCurrency } from "@/lib/utils";
import type { RecurringTransaction } from "@/types/transaction";

const shortDate = (date: string) => parseLocalDate(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** "Next: Nov 5", "Ended Oct 1" (its end date), or "Paused". */
export function scheduleLabel(item: RecurringTransaction): string {
  if (!item.enabled) return "Paused";
  const next = nextDueDate(item);
  if (next) return `Next: ${shortDate(next)}`;
  return `Ended ${shortDate(item.endDate ?? item.lastProcessedDate ?? item.startDate)}`;
}

interface RecurringRowProps {
  item: RecurringTransaction;
  onDelete: (item: RecurringTransaction) => void;
}

export function RecurringRow({ item: r, onDelete }: RecurringRowProps) {
  const { dialogs, actions } = useTracker();
  const name = r.description || r.category;

  // The same actions as a dropdown (desktop "⋯") and a sheet (tapping the row on phones).
  const groups: MenuGroup[] = [
    {
      id: "actions",
      items: [
        { kind: "action", id: "edit", label: "Edit", icon: PencilIcon, onSelect: () => dialogs.openRecurringEdit(r) },
        {
          kind: "action",
          id: "toggle",
          label: r.enabled ? "Pause" : "Resume",
          icon: r.enabled ? PauseIcon : PlayIcon,
          onSelect: () => actions.toggleRecurring(r.id),
        },
        { kind: "action", id: "delete", label: "Delete", icon: Trash2Icon, destructive: true, onSelect: () => onDelete(r) },
      ],
    },
  ];

  return (
    <Item variant="outline" size="sm" asChild role="listitem" className={`relative ${r.enabled ? "" : "opacity-50"}`}>
      <div className="flex w-full items-center">
        <ItemContent>
          <ItemTitle className="line-clamp-1 text-xs text-muted-foreground">
            <Badge variant={r.type === "income" ? "secondary" : "outline"} className="text-xs md:text-[10px]">
              <CategoryIcon name={r.category} className="size-3" />
              {r.category}
            </Badge>
            <Badge variant="outline" className="text-xs md:text-[10px]">
              {FREQUENCY_LABELS[r.frequency]}
            </Badge>
          </ItemTitle>
          <ItemDescription className="line-clamp-1 text-sm font-semibold text-foreground">{name}</ItemDescription>
        </ItemContent>
        <ItemContent>
          <ItemTitle className="line-clamp-1 w-full text-end text-xs text-muted-foreground">{scheduleLabel(r)}</ItemTitle>
          <ItemDescription
            className={`line-clamp-1 w-full text-end font-mono text-base font-bold ${
              r.type === "income" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
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
              title={name}
              groups={groups}
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={`More options for ${name}`}>
                  <MoreHorizontalIcon />
                </Button>
              }
            />
          </div>
        </ItemActions>
        <div className="md:hidden">
          <ResponsiveMenu
            mode="sheet"
            title={name}
            description={`${formatCurrency(r.amount)} · ${FREQUENCY_LABELS[r.frequency]} · ${scheduleLabel(r)}`}
            groups={groups}
            trigger={
              <button
                type="button"
                aria-label={`Actions for ${name}`}
                className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:bg-foreground/5"
              />
            }
          />
        </div>
      </div>
    </Item>
  );
}
