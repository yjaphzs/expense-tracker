"use client";

import { toast } from "sonner";

import type { Section } from "@/config/sections";
import type { TrackerData } from "@/hooks/use-tracker-data";
import type { TrackerDialogs } from "@/hooks/use-tracker-dialogs";
import type { RecurringInput } from "@/hooks/use-recurring-transactions";
import { crossedBudgets } from "@/lib/budgets";
import { rememberEntry, rememberTransfer } from "@/lib/form-memory";
import { buildTransferLegs, orderLegs, type TransferInput } from "@/lib/transfers";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";
import { isTransfer, transferPartner } from "@/types/transaction";

type EntryInput = Omit<Transaction, "id">;

const kindOf = (t: Pick<Transaction, "type" | "category" | "transfer">) =>
  isTransfer(t) ? "Transfer" : t.type === "income" ? "Income" : "Expense";

/** Adding, editing and deleting transactions, transfers and recurring items, with their toasts. */
export function useEntryActions(data: TrackerData, dialogs: TrackerDialogs, section: Section) {
  /** Deletes right away with Undo (a transfer goes with its other leg). */
  const deleteTransaction = (t: Transaction) => {
    const removed = data.removeTransaction(t.id);
    if (removed.length === 0) return;
    toast(`${kindOf(t)} deleted`, {
      description: `${t.description || t.category} · ${formatCurrency(t.amount)}`,
      action: { label: "Undo", onClick: () => data.restoreTransactions(removed) },
    });
  };

  const addEntry = (entry: EntryInput) => {
    const crossed = crossedBudgets(data.budgets, data.transactions, entry);
    data.addTransaction(entry);
    rememberEntry(entry.type, { walletId: entry.walletId, category: entry.category });
    toast.success(`${kindOf(entry)} added`);
    for (const progress of crossed) {
      toast.warning(`${progress.label} budget: ${Math.round(progress.ratio * 100)}% used`, {
        description: `${formatCurrency(progress.spent)} of ${formatCurrency(progress.budget.amount)} this month`,
      });
    }
  };

  const editEntry = (id: string, entry: EntryInput) => {
    data.editTransaction(id, entry);
    toast.success("Transaction updated");
  };

  /** Edit opens the transfer form for a transfer leg (both sides change together). */
  const openEdit = (t: Transaction) => {
    if (!isTransfer(t)) {
      dialogs.openEntry(section === "income" ? "income" : section === "expenses" ? "expense" : undefined, t);
      return;
    }
    const legs = orderLegs(t, transferPartner(data.transactions, t));
    if (legs) dialogs.openTransfer(legs);
    else toast.error("The other side of this transfer is missing", { description: "Delete it and make a new transfer." });
  };

  const saveTransfer = (input: TransferInput, description: string, editing: [Transaction, Transaction] | null) => {
    if (editing) {
      data.editTransfer(editing, input, description);
      toast.success("Transfer updated");
    } else {
      data.addTransactions(buildTransferLegs(input, crypto.randomUUID(), description));
      toast.success("Transfer added");
    }
    rememberTransfer({ fromWalletId: input.fromWalletId, toWalletId: input.toWalletId });
  };

  const addRecurring = (item: RecurringInput) => {
    data.addRecurring(item);
    rememberEntry(item.type, { walletId: item.walletId, category: item.category });
    toast.success("Recurring transaction added");
  };

  const editRecurring = (id: string, item: RecurringInput) => {
    data.editRecurring(id, item);
    toast.success("Recurring transaction updated");
  };

  const removeRecurring = (id: string) => {
    data.removeRecurring(id);
    toast.success("Recurring transaction deleted");
  };

  const toggleRecurring = (id: string) => {
    const item = data.recurring.find((r) => r.id === id);
    data.toggleRecurring(id);
    if (item) toast.success(item.enabled ? "Recurring transaction paused" : "Recurring transaction resumed");
  };

  return {
    deleteTransaction,
    addEntry,
    editEntry,
    openEdit,
    saveTransfer,
    addRecurring,
    editRecurring,
    removeRecurring,
    toggleRecurring,
  };
}

export type EntryActions = ReturnType<typeof useEntryActions>;
