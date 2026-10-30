"use client";

import { useState } from "react";
import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";

import { FilterSheet } from "@/components/smart/filters/filter-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  activeFilterCount,
  DATE_PRESET_LABELS,
  EMPTY_FILTER,
  filteredNet,
  isFiltering,
  type TransactionFilter,
} from "@/lib/transaction-filters";
import { formatCurrency } from "@/lib/utils";
import type { Transaction, Wallet } from "@/types/transaction";

interface TransactionFilterBarProps {
  filter: TransactionFilter;
  onChange: (filter: TransactionFilter) => void;
  categories: string[];
  wallets: Wallet[];
  results: Transaction[];
  /** "Search income", "Search expenses"… */
  placeholder: string;
}

function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="h-7 gap-1 pr-1 text-xs">
      {label}
      <button type="button" aria-label={`Remove ${label} filter`} onClick={onRemove} className="rounded-full p-0.5 hover:bg-foreground/10">
        <XIcon className="size-3" />
      </button>
    </Badge>
  );
}

/** Search field, Filters button (with a count), the active filters as chips, and the result line. */
export function TransactionFilterBar({ filter, onChange, categories, wallets, results, placeholder }: TransactionFilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const count = activeFilterCount(filter);
  const net = filteredNet(results);
  const walletName = (id: string) => wallets.find((w) => w.id === id)?.name ?? "Wallet";

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={placeholder}
            placeholder={placeholder}
            value={filter.query}
            onChange={(e) => onChange({ ...filter, query: e.target.value })}
            className="pr-9 pl-9 max-md:h-10"
          />
          {filter.query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onChange({ ...filter, query: "" })}
              className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
        <Button variant="outline" className="max-md:h-10" onClick={() => setSheetOpen(true)}>
          <SlidersHorizontalIcon className="size-4" />
          <span className="max-sm:sr-only">Filters</span>
          {count > 0 && <Badge className="h-5 min-w-5 px-1.5 text-[11px]">{count}</Badge>}
        </Button>
      </div>

      {count > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filter.datePreset !== "all" && (
            <RemovableChip label={DATE_PRESET_LABELS[filter.datePreset]} onRemove={() => onChange({ ...filter, datePreset: "all" })} />
          )}
          {filter.categories.map((name) => (
            <RemovableChip key={name} label={name} onRemove={() => onChange({ ...filter, categories: filter.categories.filter((c) => c !== name) })} />
          ))}
          {filter.walletIds.map((id) => (
            <RemovableChip key={id} label={walletName(id)} onRemove={() => onChange({ ...filter, walletIds: filter.walletIds.filter((w) => w !== id) })} />
          ))}
        </div>
      )}

      {isFiltering(filter) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground" aria-live="polite">
          <span>
            {results.length} result{results.length === 1 ? "" : "s"} · {net < 0 ? "−" : ""}
            {formatCurrency(Math.abs(net))}
          </span>
          <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => onChange(EMPTY_FILTER)}>
            Clear all
          </button>
        </div>
      )}

      <FilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filter={filter}
        onChange={onChange}
        categories={categories}
        wallets={wallets}
        resultCount={results.length}
      />
    </div>
  );
}
