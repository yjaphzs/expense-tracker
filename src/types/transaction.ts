export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string; // ISO date string (YYYY-MM-DD)
  walletId: string;
  /**
   * True if this transaction is one leg of a wallet-to-wallet transfer. Transfer
   * legs still carry a type ("expense" on the source wallet, "income" on the
   * destination) so per-wallet BALANCES move correctly, but they must be
   * excluded from income/expense totals, category breakdowns, and trends — a
   * transfer just moves your own money, it isn't real income or spending.
   */
  transfer?: boolean;
  /**
   * Shared by the two legs of one transfer, so deleting (or undoing) one leg
   * acts on both. Absent on transfers made before it existed; those are paired
   * by date, amount and direction instead (see `transferPartner`).
   */
  transferId?: string;
}

/**
 * The other leg of a transfer, or undefined for a normal transaction (or a
 * leg whose partner is already gone).
 */
export function transferPartner(all: Transaction[], t: Transaction): Transaction | undefined {
  if (!isTransfer(t)) return undefined;
  if (t.transferId) return all.find((o) => o.id !== t.id && o.transferId === t.transferId);
  return all.find(
    (o) =>
      o.id !== t.id &&
      isTransfer(o) &&
      !o.transferId &&
      o.date === t.date &&
      o.amount === t.amount &&
      o.type !== t.type &&
      o.walletId !== t.walletId,
  );
}

/** Category used for both legs of a wallet-to-wallet transfer. */
export const TRANSFER_CATEGORY = "Transfer";

/**
 * True when a transaction is a transfer leg. Recognizes both the explicit
 * `transfer` flag (current data) and the legacy `category === "Transfer"`
 * marker (transfers created before the flag existed), so old saved data is
 * handled correctly without a migration.
 */
export function isTransfer(t: { transfer?: boolean; category: string }): boolean {
  return t.transfer === true || t.category === TRANSFER_CATEGORY;
}

export type WalletType = "cash" | "e-wallet-card";

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
}

export const DEFAULT_WALLETS: Wallet[] = [
  { id: "cash", name: "Cash", type: "cash" },
];

export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Bills",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Allowance",
  "Freelance",
  "Investment",
  "Gift",
  "Other",
] as const;

export type RecurrenceFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  lastProcessedDate: string | null;
  enabled: boolean;
  walletId: string;
}
