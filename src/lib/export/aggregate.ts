import { type BudgetState, WARN_AT } from "@/lib/budgets";
import { monthlyBreakdown, monthlyDetail, weeklyBreakdown, type MonthDetail, type PeriodRow } from "@/lib/export/breakdowns";
import { inPeriod, monthsIn, type Period } from "@/lib/export/period";
import type { Budget, Transaction, Wallet } from "@/types/transaction";
import { isTransfer } from "@/types/transaction";

export interface CategoryShare {
  category: string;
  amount: number;
  /** Fraction of the type's total, 0–1. */
  share: number;
}

export interface WalletMovement {
  name: string;
  income: number;
  expense: number;
  transfersIn: number;
  transfersOut: number;
  /** How much the balance changed over the period. */
  net: number;
}

export interface BudgetLine {
  label: string;
  /** The monthly limit times the months in the period. */
  limit: number;
  spent: number;
  ratio: number;
  state: BudgetState;
}

/** Everything the Excel workbook and the printable report show, for one period. */
export interface ReportData {
  period: Period;
  preparedFor?: string;
  /** Income and expenses in the period (no transfers), oldest first. */
  transactions: Transaction[];
  walletNames: Record<string, string>;
  totals: { income: number; expense: number; net: number; count: number };
  expenseByCategory: CategoryShare[];
  incomeByCategory: CategoryShare[];
  wallets: WalletMovement[];
  budgets: BudgetLine[];
  weekly: PeriodRow[];
  monthly: PeriodRow[];
  monthlyDetail: MonthDetail[];
}

const sum = (items: Transaction[]) => items.reduce((total, t) => total + t.amount, 0);

function byCategory(items: Transaction[]): CategoryShare[] {
  const totals = new Map<string, number>();
  for (const t of items) totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  const total = sum(items);
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount, share: total > 0 ? amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

function walletMovement(all: Transaction[], wallets: Wallet[]): WalletMovement[] {
  return wallets.map((wallet) => {
    const mine = all.filter((t) => t.walletId === wallet.id);
    const pick = (type: Transaction["type"], transfer: boolean) =>
      sum(mine.filter((t) => t.type === type && isTransfer(t) === transfer));
    const row = { name: wallet.name, income: pick("income", false), expense: pick("expense", false), transfersIn: pick("income", true), transfersOut: pick("expense", true) };
    return { ...row, net: row.income + row.transfersIn - row.expense - row.transfersOut };
  });
}

function budgetLines(budgets: Budget[], expenses: Transaction[], months: number): BudgetLine[] {
  return [...budgets]
    .sort((a, b) => (a.category === undefined ? -1 : b.category === undefined ? 1 : a.category.localeCompare(b.category)))
    .map((budget) => {
      const spent = sum(budget.category === undefined ? expenses : expenses.filter((t) => t.category === budget.category));
      const limit = budget.amount * months;
      const ratio = limit > 0 ? spent / limit : 0;
      const state: BudgetState = ratio >= 1 ? "over" : ratio >= WARN_AT ? "warn" : "ok";
      return { label: budget.category ?? "All spending", limit, spent, ratio, state };
    });
}

interface ReportInput {
  transactions: Transaction[];
  wallets: Wallet[];
  budgets: Budget[];
  period: Period;
  preparedFor?: string;
  /** Today, for averaging the current week by the days so far. */
  today: string;
}

export function buildReport({ transactions, wallets, budgets, period, preparedFor, today }: ReportInput): ReportData {
  const inRange = transactions.filter((t) => inPeriod(t, period));
  const counted = inRange.filter((t) => !isTransfer(t)).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const income = counted.filter((t) => t.type === "income");
  const expenses = counted.filter((t) => t.type === "expense");
  const totals = { income: sum(income), expense: sum(expenses), net: sum(income) - sum(expenses), count: counted.length };
  const until = period.to < today ? period.to : today;

  return {
    period,
    preparedFor,
    transactions: counted,
    walletNames: Object.fromEntries(wallets.map((w) => [w.id, w.name])),
    totals,
    expenseByCategory: byCategory(expenses),
    incomeByCategory: byCategory(income),
    wallets: walletMovement(inRange, wallets),
    budgets: budgetLines(budgets, expenses, monthsIn(period).length),
    weekly: weeklyBreakdown(counted, period.from, until),
    monthly: monthlyBreakdown(counted, period),
    monthlyDetail: monthlyDetail(counted, period),
  };
}
