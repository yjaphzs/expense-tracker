"use client";

import { useId, type FormEvent } from "react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { FormDialogActions } from "@/components/shared/form-dialog-actions";
import { EndsField } from "@/components/smart/form/ends-field";
import { Field, AmountInput } from "@/components/smart/form/field";
import { CategorySelect, FrequencySelect, WalletSelect } from "@/components/smart/form/form-selects";
import type { FormMode } from "@/components/smart/form/form-mode";
import { EXPENSE_INCOME, TypeToggle } from "@/components/smart/form/type-toggle";
import { useTransactionForm } from "@/components/smart/form/use-transaction-form";
import { Input } from "@/components/ui/input";
import { useTracker } from "@/context/tracker-context";

const TITLES: Record<FormMode | "default", [string, string]> = {
  income: ["Add Income", "Record a new income transaction."],
  expense: ["Add Expense", "Record a new expense transaction."],
  recurring: ["Add Recurring Transaction", "Set up an automatic transaction that repeats on a schedule."],
  default: ["Add Transaction", "Record a new income, expense, or recurring transaction."],
};

const SUBMIT: Record<FormMode, string> = { income: "Add Income", expense: "Add Expense", recurring: "Add Recurring" };

/** Add or edit an income/expense, or add a recurring item. A sheet on phones. */
export default function TransactionDialog() {
  const { dialogs } = useTracker();
  const form = useTransactionForm();
  const { mode, setMode, recurringType, setRecurringType, category, setCategory, amount, setAmount } = form.fields;
  const { description, setDescription, date, setDate, walletId, setWalletId, frequency, setFrequency, endDate, setEndDate } =
    form.more;
  const id = useId();
  const [title, subtitle] = form.editing
    ? ["Edit Transaction", "Update the details of this transaction."]
    : TITLES[form.lockedMode ?? "default"];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    form.submit();
  };

  return (
    <ResponsiveDialog open={form.open} onOpenChange={dialogs.setEntryOpen}>
      <ResponsiveDialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{subtitle}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form id={id} onSubmit={onSubmit} className="flex flex-col gap-4">
            {!form.lockedMode && (
              <TypeToggle
                label="Type"
                value={mode}
                onChange={setMode}
                options={form.editing ? EXPENSE_INCOME : [...EXPENSE_INCOME, { value: "recurring", label: "Recurring" }]}
              />
            )}
            {mode === "recurring" && (
              <TypeToggle label="Recurring Type" value={recurringType} onChange={setRecurringType} options={EXPENSE_INCOME} />
            )}
            <Field id={`${id}-category`} label="Category">
              <CategorySelect id={`${id}-category`} type={form.type} value={category} onChange={setCategory} />
            </Field>
            <Field id={`${id}-wallet`} label="Wallet">
              <WalletSelect id={`${id}-wallet`} wallets={form.wallets} value={walletId} onChange={setWalletId} />
            </Field>
            <Field id={`${id}-amount`} label="Amount">
              <AmountInput id={`${id}-amount`} value={amount} onChange={setAmount} />
            </Field>
            <Field id={`${id}-description`} label="Description" optional>
              <Input
                id={`${id}-description`}
                placeholder={mode === "recurring" ? "e.g. Weekly allowance" : "e.g. Lunch at cafe"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
              />
            </Field>
            {mode === "recurring" && (
              <Field id={`${id}-frequency`} label="Frequency">
                <FrequencySelect id={`${id}-frequency`} value={frequency} onChange={setFrequency} />
              </Field>
            )}
            <Field id={`${id}-date`} label={mode === "recurring" ? "Start Date" : "Date"}>
              <DatePickerField id={`${id}-date`} value={date} onChange={setDate} />
            </Field>
            {mode === "recurring" && (
              <EndsField id={`${id}-ends`} startDate={date} frequency={frequency} value={endDate} onChange={setEndDate} />
            )}
          </form>
        </ResponsiveDialogBody>
        <FormDialogActions
          formId={id}
          submitLabel={form.editing ? "Save Changes" : SUBMIT[mode]}
          disabled={!form.valid}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
