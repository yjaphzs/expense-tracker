export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string; // ISO date string (YYYY-MM-DD)
}

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
  startDate: string; // ISO date string (YYYY-MM-DD)
  lastProcessedDate: string | null; // last date a transaction was auto-created
  enabled: boolean;
}
