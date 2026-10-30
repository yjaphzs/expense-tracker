"use client";

import type { ReactNode } from "react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  useResponsiveDialogIsDrawer,
} from "@/components/shared/responsive-dialog";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { Button } from "@/components/ui/button";
import { todayStr } from "@/lib/recurring-schedule";
import { DATE_PRESET_LABELS, EMPTY_FILTER, type DatePreset, type TransactionFilter } from "@/lib/transaction-filters";
import { cn } from "@/lib/utils";
import type { Wallet } from "@/types/transaction";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: TransactionFilter;
  onChange: (filter: TransactionFilter) => void;
  categories: string[];
  wallets: Wallet[];
  resultCount: number;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-9 rounded-full border px-3 text-sm transition-colors max-md:h-10",
        active ? "border-primary bg-primary/15 font-medium text-foreground" : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-muted-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

function Footer({ count, onClear, onDone }: { count: number; onClear: () => void; onDone: () => void }) {
  const drawer = useResponsiveDialogIsDrawer();
  const size = drawer ? "h-11" : undefined;
  const done = (
    <Button className={size} onClick={onDone}>
      Show {count} result{count === 1 ? "" : "s"}
    </Button>
  );
  const clear = (
    <Button variant="outline" className={size} onClick={onClear}>
      Clear filters
    </Button>
  );
  return <ResponsiveDialogFooter>{drawer ? <>{done}{clear}</> : <>{clear}{done}</>}</ResponsiveDialogFooter>;
}

/** Category, wallet and date filters; changes apply as they're made. */
export function FilterSheet({ open, onOpenChange, filter, onChange, categories, wallets, resultCount }: FilterSheetProps) {
  const set = (patch: Partial<TransactionFilter>) => onChange({ ...filter, ...patch });
  const setPreset = (datePreset: DatePreset) =>
    set(datePreset === "custom" ? { datePreset, from: filter.from ?? todayStr(), to: filter.to ?? todayStr() } : { datePreset });

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Filters</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Narrow the list by category, wallet, or date.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="flex flex-col gap-5">
          <Group label="Date">
            {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((preset) => (
              <Chip key={preset} active={filter.datePreset === preset} onClick={() => setPreset(preset)}>
                {DATE_PRESET_LABELS[preset]}
              </Chip>
            ))}
          </Group>
          {filter.datePreset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">From</span>
                <DatePickerField value={filter.from ?? todayStr()} onChange={(from) => set({ from })} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">To</span>
                <DatePickerField value={filter.to ?? todayStr()} onChange={(to) => set({ to })} min={filter.from} />
              </div>
            </div>
          )}
          <Group label="Category">
            {categories.map((name) => (
              <Chip key={name} active={filter.categories.includes(name)} onClick={() => set({ categories: toggle(filter.categories, name) })}>
                {name}
              </Chip>
            ))}
          </Group>
          <Group label="Wallet">
            {wallets.map((wallet) => (
              <Chip
                key={wallet.id}
                active={filter.walletIds.includes(wallet.id)}
                onClick={() => set({ walletIds: toggle(filter.walletIds, wallet.id) })}
              >
                {wallet.name}
              </Chip>
            ))}
          </Group>
        </ResponsiveDialogBody>
        <Footer
          count={resultCount}
          onClear={() => onChange({ ...EMPTY_FILTER, query: filter.query })}
          onDone={() => onOpenChange(false)}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
