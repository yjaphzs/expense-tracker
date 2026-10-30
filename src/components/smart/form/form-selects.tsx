"use client";

import { BanknoteIcon, CreditCardIcon, PlusIcon } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategoryIcon, useTracker } from "@/context/tracker-context";
import { categoryNames } from "@/lib/categories";
import { FREQUENCY_OPTIONS } from "@/lib/recurring-schedule";
import type { RecurrenceFrequency, TransactionType, Wallet } from "@/types/transaction";

const NEW_CATEGORY = "__new__";

interface CategorySelectProps {
  id: string;
  type: TransactionType;
  value: string;
  onChange: (value: string) => void;
}

/** Built-in and custom categories for a type, plus "New category…" (selected once created). */
export function CategorySelect({ id, type, value, onChange }: CategorySelectProps) {
  const { data, dialogs } = useTracker();
  const iconFor = useCategoryIcon();
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        // Radix's hidden native <select> reports "" while the value isn't among
        // its options yet (right after a category is created); never clear on that.
        if (!next) return;
        if (next !== NEW_CATEGORY) return onChange(next);
        // Select the new category once its option has rendered.
        dialogs.openCategories(type, (category) => window.setTimeout(() => onChange(category.name), 0));
      }}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categoryNames(type, data.categories).map((name) => {
          const Icon = iconFor(name);
          return (
            <SelectItem key={name} value={name}>
              <Icon className="size-4" />
              {name}
            </SelectItem>
          );
        })}
        <SelectSeparator />
        <SelectItem value={NEW_CATEGORY}>
          <PlusIcon className="size-4" />
          New category…
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

interface WalletSelectProps {
  id: string;
  wallets: Wallet[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** A wallet that can't be picked (the other side of a transfer). */
  disabledId?: string;
}

export function WalletSelect({ id, wallets, value, onChange, placeholder = "Select a wallet", disabledId }: WalletSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {wallets.map((wallet) => (
          <SelectItem key={wallet.id} value={wallet.id} disabled={wallet.id === disabledId}>
            {wallet.type === "cash" ? <BanknoteIcon className="size-4" /> : <CreditCardIcon className="size-4" />}
            {wallet.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface FrequencySelectProps {
  id: string;
  value: RecurrenceFrequency;
  onChange: (value: RecurrenceFrequency) => void;
}

export function FrequencySelect({ id, value, onChange }: FrequencySelectProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as RecurrenceFrequency)}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FREQUENCY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
