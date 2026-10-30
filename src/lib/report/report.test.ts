import { describe, expect, it } from "vitest";

import { buildReport } from "@/lib/export/aggregate";
import { resolvePeriod } from "@/lib/export/period";
import type { Transaction } from "@/types/transaction";
import { renderSummaryReport } from "./summary-report";

const tx = (id: string, over: Partial<Transaction>): Transaction => ({
  id,
  type: "expense",
  category: "Food",
  amount: 100,
  description: "",
  date: "2026-10-05",
  walletId: "cash",
  ...over,
});

const context = { appName: "Expense Tracker", appUrl: "https://expense.example/", generatedOn: "October 31, 2026" };
const report = (transactions: Transaction[], preset: "this-month" | "last-3" = "this-month") =>
  buildReport({
    transactions,
    wallets: [{ id: "cash", name: "Cash", type: "cash" }],
    budgets: [{ id: "f", category: "Food", amount: 50 }],
    period: resolvePeriod(preset, new Date(2026, 9, 31)),
    preparedFor: "Jan <b>",
    today: "2026-10-31",
  });

describe("Summary Report", () => {
  const html = renderSummaryReport(report([tx("a", { description: "<script>alert(1)</script>" }), tx("b", { type: "income", category: "Salary", amount: 1000 })]), context);

  it("escapes everything the user typed", () => {
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Jan &lt;b&gt;");
  });

  it("shows the totals, budgets, and the personal-copy marks", () => {
    expect(html).toContain("<title>Summary Report, Oct 1–31, 2026</title>");
    expect(html).toContain("₱1,000.00");
    expect(html).toContain("₱900.00");
    expect(html).toContain("bar--over");
    expect(html).toContain("Personal copy");
    expect(html).toContain("not</strong> a bank statement");
    expect(html).toContain("expense.example");
  });

  it("draws the monthly chart only for multi-month periods", () => {
    expect(html).not.toContain('aria-label="Income and expenses by month"');
    const longer = renderSummaryReport(report([tx("c", { date: "2026-08-10" }), tx("d", { date: "2026-10-10" })], "last-3"), context);
    expect(longer).toContain('aria-label="Income and expenses by month"');
  });

  it("uses no em dashes in its copy", () => {
    expect(html).not.toContain("—");
  });
});
