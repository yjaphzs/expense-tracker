"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { FormDialogActions } from "@/components/shared/form-dialog-actions";
import { Input } from "@/components/ui/input";
import { useCategoryIcon, useTracker } from "@/context/tracker-context";
import { categoryNames } from "@/lib/categories";
import type { Budget } from "@/types/transaction";

const TOTAL = "__total__";

function AmountRow({ id, label, icon, value, onChange }: { id: string; label: string; icon?: React.ReactNode; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        {icon}
        <span className="truncate">{label}</span>
      </label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        placeholder="No limit"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-36 font-mono max-md:h-10"
      />
    </div>
  );
}

/** Monthly limits: one for all spending and/or one per expense category. Empty means no limit. */
export default function BudgetsDialog() {
  const { data, dialogs, actions } = useTracker();
  const iconFor = useCategoryIcon();
  const id = useId();
  const categories = categoryNames("expense", data.categories);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!dialogs.budgetsOpen) return;
    setDraft(Object.fromEntries(data.budgets.map((b) => [b.category ?? TOTAL, String(b.amount)])));
    // Only on open: a background sync must not wipe what the user is typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogs.budgetsOpen]);

  const set = (key: string) => (value: string) => setDraft((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const existing = new Map(data.budgets.map((b) => [b.category ?? TOTAL, b.id]));
    const budgets: Budget[] = [];
    for (const [key, raw] of Object.entries(draft)) {
      const amount = Math.round(parseFloat(raw) * 100) / 100;
      if (!(amount > 0) || (key !== TOTAL && !categories.includes(key))) continue;
      const budget: Budget = { id: existing.get(key) ?? crypto.randomUUID(), amount };
      if (key !== TOTAL) budget.category = key;
      budgets.push(budget);
    }
    actions.saveBudgets(budgets);
    dialogs.setBudgetsOpen(false);
  };

  return (
    <ResponsiveDialog open={dialogs.budgetsOpen} onOpenChange={dialogs.setBudgetsOpen}>
      <ResponsiveDialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Monthly budgets</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Set a limit for all spending, per category, or both. Leave a field empty for no limit. Transfers never count.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form id={id} onSubmit={onSubmit} className="flex flex-col gap-3">
            <AmountRow id={`${id}-total`} label="All spending" value={draft[TOTAL] ?? ""} onChange={set(TOTAL)} />
            <p className="mt-2 text-xs font-medium text-muted-foreground">By category</p>
            {categories.map((name, index) => {
              const Icon = iconFor(name);
              return (
                <AmountRow
                  key={name}
                  id={`${id}-c${index}`}
                  label={name}
                  icon={<Icon className="size-4 shrink-0 text-muted-foreground" />}
                  value={draft[name] ?? ""}
                  onChange={set(name)}
                />
              );
            })}
          </form>
        </ResponsiveDialogBody>
        <FormDialogActions formId={id} submitLabel="Save budgets" />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
