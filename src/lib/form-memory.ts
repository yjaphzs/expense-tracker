import type { TransactionType } from "@/types/transaction";

/**
 * The wallet and category last used per kind of entry, kept on this device so
 * the Add forms start where the user usually is. Not synced: it's a
 * convenience, not data.
 */
const KEY = "expense_tracker_last_used";

export interface EntryMemory {
  walletId?: string;
  category?: string;
}

export interface TransferMemory {
  fromWalletId?: string;
  toWalletId?: string;
}

interface FormMemory {
  income?: EntryMemory;
  expense?: EntryMemory;
  transfer?: TransferMemory;
}

function read(): FormMemory {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as FormMemory) : {};
  } catch {
    return {};
  }
}

function write(next: FormMemory): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function recallEntry(type: TransactionType): EntryMemory {
  return read()[type] ?? {};
}

export function rememberEntry(type: TransactionType, memory: EntryMemory): void {
  write({ ...read(), [type]: memory });
}

export function recallTransfer(): TransferMemory {
  return read().transfer ?? {};
}

export function rememberTransfer(memory: TransferMemory): void {
  write({ ...read(), transfer: memory });
}
