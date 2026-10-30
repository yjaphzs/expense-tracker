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
import { DatePickerField } from "@/components/shared/date-picker-field";
import { FormDialogActions } from "@/components/shared/form-dialog-actions";
import { EndsField } from "@/components/smart/form/ends-field";
import { AmountInput, Field } from "@/components/smart/form/field";
import { CategorySelect, FrequencySelect, WalletSelect } from "@/components/smart/form/form-selects";
import { EXPENSE_INCOME, TypeToggle } from "@/components/smart/form/type-toggle";
import { Input } from "@/components/ui/input";
import { useTracker } from "@/context/tracker-context";
import { todayStr } from "@/lib/recurring-schedule";
import type { RecurrenceFrequency, TransactionType } from "@/types/transaction";

/** Edit a recurring item (new ones are added from the transaction form). */
export default function EditRecurringDialog() {
  const { data, dialogs, actions } = useTracker();
  const { open, editing } = dialogs.recurring;
  const id = useId();

  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [walletId, setWalletId] = useState("");

  useEffect(() => {
    if (!open || !editing) return;
    setType(editing.type);
    setCategory(editing.category);
    setAmount(String(editing.amount));
    setDescription(editing.description);
    setFrequency(editing.frequency);
    setStartDate(editing.startDate);
    setEndDate(editing.endDate);
    setWalletId(editing.walletId);
  }, [open, editing]);

  const parsedAmount = parseFloat(amount);
  const valid = !!category && !!walletId && parsedAmount > 0;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid || !editing) return;
    actions.editRecurring(editing.id, {
      type,
      category,
      amount: parsedAmount,
      description: description.trim(),
      frequency,
      startDate,
      endDate,
      walletId,
    });
    dialogs.setRecurringOpen(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={dialogs.setRecurringOpen}>
      <ResponsiveDialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit Recurring Transaction</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Update the details of this recurring transaction.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form id={id} onSubmit={onSubmit} className="grid gap-4">
            <TypeToggle
              label="Type"
              value={type}
              options={EXPENSE_INCOME}
              onChange={(next) => {
                setType(next);
                setCategory("");
              }}
            />
            <Field id={`${id}-category`} label="Category">
              <CategorySelect id={`${id}-category`} type={type} value={category} onChange={setCategory} />
            </Field>
            <Field id={`${id}-wallet`} label="Wallet">
              <WalletSelect id={`${id}-wallet`} wallets={data.wallets} value={walletId} onChange={setWalletId} />
            </Field>
            <Field id={`${id}-amount`} label="Amount">
              <AmountInput id={`${id}-amount`} value={amount} onChange={setAmount} />
            </Field>
            <Field id={`${id}-description`} label="Description" optional>
              <Input
                id={`${id}-description`}
                placeholder="e.g. Weekly allowance from parents"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
              />
            </Field>
            <Field id={`${id}-frequency`} label="Frequency">
              <FrequencySelect id={`${id}-frequency`} value={frequency} onChange={setFrequency} />
            </Field>
            <Field id={`${id}-date`} label="Start Date">
              <DatePickerField id={`${id}-date`} value={startDate} onChange={setStartDate} />
            </Field>
            <EndsField id={`${id}-ends`} startDate={startDate} frequency={frequency} value={endDate} onChange={setEndDate} />
          </form>
        </ResponsiveDialogBody>
        <FormDialogActions formId={id} submitLabel="Save Changes" disabled={!valid} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
