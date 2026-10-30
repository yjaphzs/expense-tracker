"use client";

import { useCallback, useRef, useState } from "react";

import type { FormMode } from "@/components/smart/form/form-mode";
import type { CustomCategory, RecurringTransaction, Transaction, TransactionType, Wallet } from "@/types/transaction";

interface EntryDialog {
  open: boolean;
  mode?: FormMode;
  editing: Transaction | null;
}

interface Editable<T> {
  open: boolean;
  editing: T | null;
}

/** Which overlay is open, and what it's editing. Each `editing` value is kept while it animates closed. */
export function useTrackerDialogs() {
  const [entry, setEntry] = useState<EntryDialog>({ open: false, editing: null });
  const [recurring, setRecurring] = useState<Editable<RecurringTransaction>>({ open: false, editing: null });
  const [transfer, setTransfer] = useState<Editable<[Transaction, Transaction]>>({ open: false, editing: null });
  const [walletForm, setWalletForm] = useState<Editable<Wallet>>({ open: false, editing: null });
  const [categories, setCategories] = useState<{ open: boolean; addType?: TransactionType }>({ open: false });
  const [qr, setQr] = useState({ open: false, used: false });
  const [walletsOpen, setWalletsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [budgetsOpen, setBudgetsOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

  const openEntry = useCallback((mode?: FormMode, editing: Transaction | null = null) => {
    setEntry({ open: true, mode, editing });
  }, []);
  const setEntryOpen = useCallback((open: boolean) => setEntry((prev) => ({ ...prev, open })), []);

  const openRecurringEdit = useCallback((item: RecurringTransaction) => setRecurring({ open: true, editing: item }), []);
  const setRecurringOpen = useCallback((open: boolean) => setRecurring((prev) => ({ ...prev, open })), []);

  const openTransfer = useCallback((editing: [Transaction, Transaction] | null = null) => {
    setTransfer({ open: true, editing });
  }, []);
  const setTransferOpen = useCallback((open: boolean) => setTransfer((prev) => ({ ...prev, open })), []);

  const openWalletForm = useCallback((editing: Wallet | null = null) => setWalletForm({ open: true, editing }), []);
  const setWalletFormOpen = useCallback((open: boolean) => setWalletForm((prev) => ({ ...prev, open })), []);

  /**
   * `addType` opens straight to the add form (from "+ New category" in a
   * category picker); `onCreated` lets that picker select the new category.
   */
  const onCategoryCreated = useRef<((category: CustomCategory) => void) | null>(null);
  const openCategories = useCallback((addType?: TransactionType, onCreated?: (category: CustomCategory) => void) => {
    onCategoryCreated.current = onCreated ?? null;
    setCategories({ open: true, addType });
  }, []);
  const setCategoriesOpen = useCallback((open: boolean) => setCategories((prev) => ({ ...prev, open })), []);

  // The QR dialog's code (QR libraries, camera scanner) loads the first time it's opened.
  const openQr = useCallback(() => setQr({ open: true, used: true }), []);
  const setQrOpen = useCallback((open: boolean) => setQr((prev) => ({ ...prev, open })), []);

  return {
    entry,
    openEntry,
    setEntryOpen,
    recurring,
    openRecurringEdit,
    setRecurringOpen,
    transfer,
    openTransfer,
    setTransferOpen,
    walletForm,
    openWalletForm,
    setWalletFormOpen,
    categories,
    openCategories,
    onCategoryCreated,
    setCategoriesOpen,
    qr,
    openQr,
    setQrOpen,
    walletsOpen,
    setWalletsOpen,
    resetOpen,
    setResetOpen,
    budgetsOpen,
    setBudgetsOpen,
    csvOpen,
    setCsvOpen,
  };
}

export type TrackerDialogs = ReturnType<typeof useTrackerDialogs>;
