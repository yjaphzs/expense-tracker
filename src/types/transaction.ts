export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string; // ISO date string (YYYY-MM-DD)
  walletId: string;
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
