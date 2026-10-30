"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ToggleOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Look when selected: red for expenses, green for income, the primary color otherwise. */
  tone?: "expense" | "income" | "primary";
}

interface TypeToggleProps<T extends string> {
  label: string;
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
}

const TONE = {
  expense: "",
  income: "bg-emerald-600 text-white hover:bg-emerald-700",
  primary: "",
};

/** A row of buttons acting as one choice (Expense / Income, Cash / Card…). */
export function TypeToggle<T extends string>({ label, value, options, onChange }: TypeToggleProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div role="group" aria-label={label} className="flex gap-2">
        {options.map((option) => {
          const active = option.value === value;
          const tone = option.tone ?? "primary";
          return (
            <Button
              key={option.value}
              type="button"
              aria-pressed={active}
              variant={active ? (tone === "expense" ? "destructive" : "default") : "outline"}
              className={cn("flex-1", active && TONE[tone])}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export const EXPENSE_INCOME: ToggleOption<"expense" | "income">[] = [
  { value: "expense", label: "Expense", tone: "expense" },
  { value: "income", label: "Income", tone: "income" },
];
