"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { ArrowRightIcon } from "lucide-react";

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
import { AmountInput, Field } from "@/components/smart/form/field";
import { WalletSelect } from "@/components/smart/form/form-selects";
import { Input } from "@/components/ui/input";
import { useTracker } from "@/context/tracker-context";
import { recallTransfer } from "@/lib/form-memory";
import { todayStr } from "@/lib/recurring-schedule";
import { defaultTransferDescription, transferInputFrom } from "@/lib/transfers";

/** Move money between two wallets, or edit an existing transfer (both sides change together). */
export default function TransferDialog() {
  const { data, dialogs, actions } = useTracker();
  const { open, editing } = dialogs.transfer;
  const wallets = data.wallets;
  const id = useId();

  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayStr);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const input = transferInputFrom(editing);
      setFromWalletId(input.fromWalletId);
      setToWalletId(input.toWalletId);
      setAmount(String(input.amount));
      // Keep a generated "Transfer: A → B" out of the field so it follows wallet changes.
      setDescription(input.description === defaultTransferDescription(wallets, input) ? "" : input.description);
      setDate(input.date);
      return;
    }
    const memory = recallTransfer();
    const exists = (walletId?: string) => (wallets.some((w) => w.id === walletId) ? walletId! : "");
    setFromWalletId(exists(memory.fromWalletId));
    setToWalletId(exists(memory.toWalletId));
    setAmount("");
    setDescription("");
    setDate(todayStr());
    // Wallets aren't a dep: editing them elsewhere mustn't reset this form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const parsedAmount = parseFloat(amount);
  const valid = !!fromWalletId && !!toWalletId && fromWalletId !== toWalletId && parsedAmount > 0;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    const input = { fromWalletId, toWalletId, amount: parsedAmount, description: description.trim(), date };
    actions.saveTransfer(input, input.description || defaultTransferDescription(wallets, input), editing);
    dialogs.setTransferOpen(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={dialogs.setTransferOpen}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{editing ? "Edit Transfer" : "Transfer Between Wallets"}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {editing ? "Both sides of the transfer update together." : "Move funds from one wallet to another."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form id={id} onSubmit={onSubmit} className="flex flex-col gap-4">
            {/* From and To sit side by side from sm up, stacked on phones. */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-2">
              <div className="flex flex-1 flex-col">
                <Field id={`${id}-from`} label="From">
                  <WalletSelect
                    id={`${id}-from`}
                    wallets={wallets}
                    value={fromWalletId}
                    onChange={setFromWalletId}
                    placeholder="Source wallet"
                    disabledId={toWalletId}
                  />
                </Field>
              </div>
              <div className="flex items-center justify-center pt-2 sm:pt-0 sm:pb-2" aria-hidden>
                <ArrowRightIcon className="size-5 rotate-90 text-muted-foreground sm:rotate-0" />
              </div>
              <div className="flex flex-1 flex-col">
                <Field id={`${id}-to`} label="To">
                  <WalletSelect
                    id={`${id}-to`}
                    wallets={wallets}
                    value={toWalletId}
                    onChange={setToWalletId}
                    placeholder="Target wallet"
                    disabledId={fromWalletId}
                  />
                </Field>
              </div>
            </div>
            <Field id={`${id}-amount`} label="Amount">
              <AmountInput id={`${id}-amount`} value={amount} onChange={setAmount} />
            </Field>
            <Field id={`${id}-date`} label="Date">
              <DatePickerField id={`${id}-date`} value={date} onChange={setDate} />
            </Field>
            <Field id={`${id}-description`} label="Description" optional>
              <Input
                id={`${id}-description`}
                placeholder="e.g. Move savings to cash"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
              />
            </Field>
          </form>
        </ResponsiveDialogBody>
        <FormDialogActions formId={id} submitLabel={editing ? "Save Changes" : "Transfer"} disabled={!valid} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
