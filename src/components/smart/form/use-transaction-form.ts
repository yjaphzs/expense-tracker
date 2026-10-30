"use client";

import { useEffect, useState } from "react";

import type { FormMode } from "@/components/smart/form/form-mode";
import { useTracker } from "@/context/tracker-context";
import { categoryNames } from "@/lib/categories";
import { recallEntry } from "@/lib/form-memory";
import { todayStr } from "@/lib/recurring-schedule";
import type { RecurrenceFrequency, TransactionType } from "@/types/transaction";

/** State and submit for the Add/Edit transaction form (one-off or recurring). */
export function useTransactionForm() {
  const { data, dialogs, actions } = useTracker();
  const { open, mode: lockedMode, editing } = dialogs.entry;

  const [mode, setModeState] = useState<FormMode>("expense");
  const [recurringType, setRecurringTypeState] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayStr);
  const [walletId, setWalletId] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  const type: TransactionType = mode === "recurring" ? recurringType : mode;

  /** The last wallet and category used for this type, if they still exist. */
  const recall = (forType: TransactionType) => {
    const memory = recallEntry(forType);
    const wallet = data.wallets.find((w) => w.id === memory.walletId) ?? data.wallets[0];
    setWalletId(wallet?.id ?? "");
    setCategory(memory.category && categoryNames(forType, data.categories).includes(memory.category) ? memory.category : "");
  };

  // Reset whenever the form opens; wallets/categories aren't deps on purpose
  // (editing them mid-form must not wipe what the user typed).
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setModeState(editing.type);
      setCategory(editing.category);
      setAmount(String(editing.amount));
      setDescription(editing.description);
      setDate(editing.date);
      setWalletId(editing.walletId);
      return;
    }
    const start = lockedMode ?? "expense";
    setModeState(start);
    setRecurringTypeState("expense");
    setAmount("");
    setDescription("");
    setDate(todayStr());
    setFrequency("monthly");
    setEndDate(undefined);
    recall(start === "recurring" ? "expense" : start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, lockedMode]);

  const setMode = (next: FormMode) => {
    setModeState(next);
    if (!editing) recall(next === "recurring" ? recurringType : next);
    else setCategory("");
  };
  const setRecurringType = (next: TransactionType) => {
    setRecurringTypeState(next);
    recall(next);
  };

  const parsedAmount = parseFloat(amount);
  const valid = !!category && !!walletId && parsedAmount > 0;

  const submit = () => {
    if (!valid) return;
    const base = { category, amount: parsedAmount, description: description.trim(), walletId };
    if (mode === "recurring") {
      actions.addRecurring({ ...base, type: recurringType, frequency, startDate: date, endDate });
    } else if (editing) {
      actions.editEntry(editing.id, { ...base, type: mode, date });
    } else {
      actions.addEntry({ ...base, type: mode, date });
    }
    dialogs.setEntryOpen(false);
  };

  return {
    open,
    lockedMode,
    editing,
    wallets: data.wallets,
    type,
    valid,
    submit,
    fields: { mode, setMode, recurringType, setRecurringType, category, setCategory, amount, setAmount },
    more: { description, setDescription, date, setDate, walletId, setWalletId, frequency, setFrequency, endDate, setEndDate },
  };
}
