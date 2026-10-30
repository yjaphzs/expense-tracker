import type { ReportData } from "@/lib/export/aggregate";
import { rangeLabel } from "@/lib/export/period";
import { renderDisclaimer, renderHeader, renderRunningFooter } from "@/lib/report/blocks/chrome";
import { renderDetails, renderTiles } from "@/lib/report/blocks/summary";
import { renderBudgets, renderCategories, renderTransactions, renderWallets } from "@/lib/report/blocks/tables";
import { renderMonthlyChart } from "@/lib/report/blocks/trend-chart";
import { printHtmlDocument } from "@/lib/report/print-html";
import { renderDocument } from "@/lib/report/render-document";
import { formatCurrency } from "@/lib/utils";

export interface ReportContext {
  appName: string;
  appUrl: string;
  /** e.g. "October 31, 2026" */
  generatedOn: string;
}

/**
 * The printable Summary Report: totals, budgets, a monthly chart, categories,
 * wallets and every transaction in the period. Deliberately not called a
 * "statement": it's a personal record, never an official one.
 */
export function renderSummaryReport(report: ReportData, { appName, appUrl, generatedOn }: ReportContext): string {
  const range = rangeLabel(report.period);
  const { income, expense, net, count } = report.totals;
  const body = [
    renderHeader(appName, "Summary Report", `${report.period.label} · ${range}`),
    renderDetails([
      ["Prepared for", report.preparedFor],
      ["Period", range],
      ["Generated", generatedOn],
    ]),
    renderTiles([
      { label: "Income", value: formatCurrency(income), tone: "income" },
      { label: "Expenses", value: formatCurrency(expense), tone: "expense" },
      { label: "Net", value: formatCurrency(net), hero: true, tone: net < 0 ? "expense" : "income" },
      { label: "Transactions", value: String(count) },
    ]),
    renderBudgets(report.budgets),
    renderMonthlyChart(report.monthly),
    renderCategories("Spending by category", report.expenseByCategory, "expense"),
    renderCategories("Income by category", report.incomeByCategory, "income"),
    renderWallets(report.wallets),
    renderTransactions(report),
    renderDisclaimer(appName, generatedOn),
  ].join("\n");

  return renderDocument({
    title: `Summary Report, ${range}`,
    body,
    footer: renderRunningFooter(appName, appUrl),
  });
}

/** Opens the print dialog (print or save as PDF) for the report. */
export function printSummaryReport(report: ReportData, context: ReportContext): void {
  printHtmlDocument(renderSummaryReport(report, context));
}
