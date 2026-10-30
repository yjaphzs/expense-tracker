import type { Budget, Transaction } from "@/types/transaction";
import { isTransfer } from "@/types/transaction";

export type BudgetState = "ok" | "warn" | "over";

export interface BudgetProgress {
  budget: Budget;
  /** "This month" for the whole-month budget, otherwise the category. */
  label: string;
  spent: number;
  /** spent ÷ amount (can exceed 1). */
  ratio: number;
  state: BudgetState;
}

// The bar turns to a warning at 80% and red once the limit is reached.
export const WARN_AT = 0.8;

/** "YYYY-MM" of a "YYYY-MM-DD" date. */
export const monthOf = (date: string) => date.slice(0, 7);

function stateFor(ratio: number): BudgetState {
  return ratio >= 1 ? "over" : ratio >= WARN_AT ? "warn" : "ok";
}

/** Spending in a month (transfers excluded), optionally for one category. */
export function monthSpending(transactions: Transaction[], month: string, category?: string): number {
  return transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        !isTransfer(t) &&
        monthOf(t.date) === month &&
        (category === undefined || t.category === category),
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Every budget's progress for `month`: the whole-month budget first, then by category name. */
export function budgetProgress(budgets: Budget[], transactions: Transaction[], month: string): BudgetProgress[] {
  return [...budgets]
    .sort((a, b) => (a.category === undefined ? -1 : b.category === undefined ? 1 : a.category.localeCompare(b.category)))
    .map((budget) => {
      const spent = monthSpending(transactions, month, budget.category);
      const ratio = budget.amount > 0 ? spent / budget.amount : 0;
      return { budget, label: budget.category ?? "This month", spent, ratio, state: stateFor(ratio) };
    });
}

/**
 * Budgets that a new expense pushes past 80% or 100% this month (each one
 * reported once, at the highest line it crosses). Used for the warning toast.
 */
export function crossedBudgets(
  budgets: Budget[],
  before: Transaction[],
  expense: Pick<Transaction, "type" | "category" | "amount" | "date" | "transfer">,
): BudgetProgress[] {
  if (expense.type !== "expense" || isTransfer(expense as Transaction)) return [];
  const month = monthOf(expense.date);
  const after = [...before, { ...expense, id: "new", description: "", walletId: "" } as Transaction];
  const was = new Map(budgetProgress(budgets, before, month).map((p) => [p.budget.id, p.state]));
  return budgetProgress(
    budgets.filter((b) => b.category === undefined || b.category === expense.category),
    after,
    month,
  ).filter((p) => p.state !== "ok" && p.state !== was.get(p.budget.id));
}
