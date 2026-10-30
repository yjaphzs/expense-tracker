import { describe, expect, it } from "vitest";

import type { Transaction } from "@/types/transaction";
import { buildReport } from "./aggregate";
import { weekRanges } from "./breakdowns";
import { monthsIn, rangeLabel, resolvePeriod } from "./period";
import { buildSheets, workbookFileName } from "./xlsx/workbook";
import { excelDate } from "./xlsx/sheet-builder";

let n = 0;
const tx = (over: Partial<Transaction>): Transaction => ({
  id: `t${++n}`,
  type: "expense",
  category: "Food",
  amount: 100,
  description: "",
  date: "2026-10-05",
  walletId: "cash",
  ...over,
});
const wallets = [
  { id: "cash", name: "Cash", type: "cash" as const },
  { id: "gcash", name: "GCash", type: "e-wallet-card" as const },
];
const today = new Date(2026, 9, 31);

describe("period", () => {
  it("resolves presets against today", () => {
    expect(resolvePeriod("this-month", today)).toMatchObject({ from: "2026-10-01", to: "2026-10-31", label: "This Month" });
    expect(resolvePeriod("last-3", today)).toMatchObject({ from: "2026-08-01", to: "2026-10-31" });
    expect(resolvePeriod("last-year", today)).toMatchObject({ from: "2025-01-01", to: "2025-12-31" });
    expect(resolvePeriod("all", today, [tx({ date: "2025-03-02" }), tx({ date: "2026-01-09" })])).toMatchObject({ from: "2025-03-02", to: "2026-01-09" });
  });

  it("labels ranges with en dashes only between numbers", () => {
    expect(rangeLabel({ from: "2026-10-01", to: "2026-10-31" })).toBe("Oct 1–31, 2026");
    expect(rangeLabel({ from: "2026-09-01", to: "2026-10-31" })).toBe("Sep 1 – Oct 31, 2026");
    expect(rangeLabel({ from: "2025-12-01", to: "2026-01-31" })).toBe("Dec 1, 2025 – Jan 31, 2026");
    expect(monthsIn({ from: "2025-11-15", to: "2026-02-01" })).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("splits weeks Monday to Sunday, clipped to the range", () => {
    expect(weekRanges("2026-10-01", "2026-10-12")).toEqual([
      { from: "2026-10-01", to: "2026-10-04" },
      { from: "2026-10-05", to: "2026-10-11" },
      { from: "2026-10-12", to: "2026-10-12" },
    ]);
  });
});

describe("buildReport", () => {
  const transactions = [
    tx({ type: "income", category: "Salary", amount: 20000, walletId: "gcash", date: "2026-10-01" }),
    tx({ amount: 300, date: "2026-10-03" }),
    tx({ category: "Bills", amount: 1500, walletId: "gcash", date: "2026-10-04" }),
    tx({ type: "expense", category: "Transfer", transfer: true, amount: 2000, walletId: "gcash", date: "2026-10-05" }),
    tx({ type: "income", category: "Transfer", transfer: true, amount: 2000, walletId: "cash", date: "2026-10-05" }),
    tx({ amount: 999, date: "2026-09-30" }),
  ];
  const report = buildReport({
    transactions,
    wallets,
    budgets: [{ id: "food", category: "Food", amount: 250 }, { id: "all", amount: 10000 }],
    period: resolvePeriod("this-month", today),
    preparedFor: "Jan",
    today: "2026-10-31",
  });

  it("totals the period without transfers", () => {
    expect(report.totals).toEqual({ income: 20000, expense: 1800, net: 18200, count: 3 });
    expect(report.expenseByCategory.map((c) => [c.category, c.amount])).toEqual([["Bills", 1500], ["Food", 300]]);
    expect(report.expenseByCategory[0].share).toBeCloseTo(1500 / 1800);
  });

  it("shows how each wallet moved, transfers included", () => {
    expect(report.wallets.find((w) => w.name === "GCash")).toMatchObject({ income: 20000, expense: 1500, transfersOut: 2000, net: 16500 });
    expect(report.wallets.find((w) => w.name === "Cash")).toMatchObject({ transfersIn: 2000, net: 1700 });
  });

  it("compares budgets with spending", () => {
    expect(report.budgets.map((b) => [b.label, b.limit, b.spent, b.state])).toEqual([
      ["All spending", 10000, 1800, "ok"],
      ["Food", 250, 300, "over"],
    ]);
  });

  it("builds every sheet with the themed header, real dates and peso formats", () => {
    const sheets = Object.fromEntries(buildSheets(report, "October 31, 2026"));
    expect(Object.keys(sheets)).toEqual(["Summary", "Transactions", "Weekly", "Monthly", "Monthly Detail"]);
    const tx = sheets.Transactions as Record<string, { v: unknown; t: string; z?: string; s: { fill?: { fgColor: { rgb: string } } } }>;
    expect(tx.A1.v).toBe("Expense Tracker  ·  Transactions");
    expect(tx.A1.s.fill?.fgColor.rgb).toBe("18181B");
    expect(tx.A3.s.fill?.fgColor.rgb).toBe("EAB308");
    expect(tx.A4.v).toBe("Prepared for Jan  ·  Generated October 31, 2026");
    expect(tx.A6.v).toBe("Date");
    expect(tx.A7).toMatchObject({ t: "n", v: excelDate("2026-10-01"), z: "mmm d, yyyy" });
    expect(tx.F7).toMatchObject({ t: "n", v: 20000, z: '"₱"#,##0.00;-"₱"#,##0.00' });
    expect((sheets.Transactions as { "!autofilter": { ref: string } })["!autofilter"].ref).toBe("A6:F9");
    expect((sheets.Summary as { "!merges": unknown[] })["!merges"].length).toBeGreaterThan(3);
    expect(workbookFileName(report, "2026-10-31")).toBe("expense-tracker-this-month-2026-10-31.xlsx");
  });

  it("dates cells as Excel serial days", () => {
    expect(excelDate("1900-03-01")).toBe(61);
    expect(excelDate("2026-10-31")).toBe(46326);
  });
});
