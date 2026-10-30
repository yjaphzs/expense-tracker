"use client";

import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";

interface FieldProps {
  id: string;
  label: string;
  optional?: boolean;
  children: ReactNode;
}

/** A label linked to its control, stacked above it. */
export function Field({ id, label, optional, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label} {optional && <span className="text-muted-foreground/50">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

interface AmountInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

/** Peso amount with the decimal keypad on phones. */
export function AmountInput({ id, value, onChange }: AmountInputProps) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      step="0.01"
      min="0.01"
      placeholder="0.00"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="font-mono"
    />
  );
}
