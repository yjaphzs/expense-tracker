import type { ReportData } from "@/lib/export/aggregate";
import type { PeriodRow } from "@/lib/export/breakdowns";
import { writeSheetHeader } from "@/lib/export/xlsx/header";
import { colName, SheetWriter, type Column, type Sheet } from "@/lib/export/xlsx/sheet-builder";

/** Every income and expense in the period, oldest first, with an autofilter and totals. */
export function transactionsSheet(report: ReportData, generatedOn: string): Sheet {
  const columns: Column[] = [
    { header: "Date", width: 14, kind: "date" },
    { header: "Type", width: 10 },
    { header: "Category", width: 18 },
    { header: "Description", width: 34 },
    { header: "Wallet", width: 16 },
    { header: "Amount", width: 16, kind: "money" },
  ];
  const sheet = new SheetWriter(columns.length);
  const start = writeSheetHeader(sheet, "Transactions", report, generatedOn);
  const { income, expense, net } = report.totals;
  const end = sheet.table(start, columns, [
    ...report.transactions.map((t) => ({
      values: [t.date, t.type === "income" ? "Income" : "Expense", t.category, t.description, report.walletNames[t.walletId] ?? "", t.amount],
      options: { tone: t.type },
    })),
    { values: ["", "", "", "", "Total income", income], options: { total: true, tone: "income" as const } },
    { values: ["", "", "", "", "Total expenses", expense], options: { bold: true, tone: "expense" as const } },
    { values: ["", "", "", "", "Net", net], options: { bold: true, tone: "net" as const } },
  ]);
  // Filter on the header row over the transaction rows (not the totals).
  const lastRow = end - 3;
  return sheet.finish(columns, { "!autofilter": { ref: `A${start + 1}:${colName(columns.length - 1)}${lastRow}` } });
}

const AMOUNT_COLUMNS = (first: string, width: number): Column[] => [
  { header: first, width },
  { header: "Income", width: 16, kind: "money" },
  { header: "Expenses", width: 16, kind: "money" },
  { header: "Net", width: 16, kind: "money" },
  { header: "Avg spent/day", width: 16, kind: "money" },
];

const periodRow = (r: PeriodRow) => ({
  values: [r.label, r.income, r.expense, r.net, r.avgPerDay],
  options: { tones: [undefined, "income", "expense", "net", "muted"] as const },
});

function totalsRow(rows: PeriodRow[]) {
  const income = rows.reduce((s, r) => s + r.income, 0);
  const expense = rows.reduce((s, r) => s + r.expense, 0);
  return { values: ["Total", income, expense, income - expense, null], options: { total: true, tones: [undefined, "income", "expense", "net"] as const } };
}

/** Weeks (Monday to Sunday) with activity, newest first. */
export function weeklySheet(report: ReportData, generatedOn: string): Sheet {
  const columns = AMOUNT_COLUMNS("Week", 28);
  const sheet = new SheetWriter(columns.length);
  const start = writeSheetHeader(sheet, "Weekly", report, generatedOn);
  sheet.table(start, columns, [...report.weekly.map(periodRow), totalsRow(report.weekly)]);
  return sheet.finish(columns);
}

/** One row per month of the period. */
export function monthlySheet(report: ReportData, generatedOn: string): Sheet {
  const columns = AMOUNT_COLUMNS("Month", 20);
  const sheet = new SheetWriter(columns.length);
  const start = writeSheetHeader(sheet, "Monthly", report, generatedOn);
  sheet.table(start, columns, [...report.monthly.map(periodRow), totalsRow(report.monthly)]);
  return sheet.finish(columns);
}

/** Each month (bold, amber) followed by its weeks (indented, muted label). */
export function monthlyDetailSheet(report: ReportData, generatedOn: string): Sheet {
  const columns = AMOUNT_COLUMNS("Period", 30);
  const sheet = new SheetWriter(columns.length);
  const start = writeSheetHeader(sheet, "Monthly Detail", report, generatedOn);
  const rows = report.monthlyDetail.flatMap((month) => [
    { values: [month.label, month.income, month.expense, month.net, month.avgPerDay], options: { bold: true, tones: ["accent", "income", "expense", "net", "muted"] as const } },
    ...month.weeks.map((week) => ({ ...periodRow(week), values: [`    ${week.label}`, ...periodRow(week).values.slice(1)] })),
  ]);
  sheet.table(start, columns, rows);
  return sheet.finish(columns);
}
