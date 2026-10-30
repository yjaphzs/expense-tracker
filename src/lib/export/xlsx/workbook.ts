import type { ReportData } from "@/lib/export/aggregate";
import { monthlyDetailSheet, monthlySheet, transactionsSheet, weeklySheet } from "@/lib/export/xlsx/detail-sheets";
import type { Sheet } from "@/lib/export/xlsx/sheet-builder";
import { summarySheet } from "@/lib/export/xlsx/summary-sheet";

type XlsxModule = typeof import("xlsx-js-style");

/** The workbook's sheets, Summary first. Pure: no library needed (tests read these directly). */
export function buildSheets(report: ReportData, generatedOn: string): [string, Sheet][] {
  return [
    ["Summary", summarySheet(report, generatedOn)],
    ["Transactions", transactionsSheet(report, generatedOn)],
    ["Weekly", weeklySheet(report, generatedOn)],
    ["Monthly", monthlySheet(report, generatedOn)],
    ["Monthly Detail", monthlyDetailSheet(report, generatedOn)],
  ];
}

export function buildWorkbook(XLSX: XlsxModule, report: ReportData, generatedOn: string) {
  const workbook = XLSX.utils.book_new();
  for (const [name, sheet] of buildSheets(report, generatedOn)) {
    XLSX.utils.book_append_sheet(workbook, sheet as never, name);
  }
  workbook.Props = {
    Title: `Expense Tracker · ${report.period.label}`,
    Subject: "Income and expenses",
    Author: report.preparedFor ?? "Expense Tracker",
    CreatedDate: new Date(),
  };
  return workbook;
}

/** "expense-tracker-this-month-2026-10-31.xlsx" */
export function workbookFileName(report: ReportData, today: string): string {
  const slug = report.period.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `expense-tracker-${slug}-${today}.xlsx`;
}

/** Loads the spreadsheet library on first use (it's about 140 KB compressed) and downloads the file. */
export async function downloadWorkbook(report: ReportData, generatedOn: string, today: string): Promise<void> {
  const mod = await import("xlsx-js-style");
  // CommonJS package: the bundler exposes it as `default`.
  const XLSX = ((mod as unknown as { default?: XlsxModule }).default ?? mod) as XlsxModule;
  XLSX.writeFile(buildWorkbook(XLSX, report, generatedOn), workbookFileName(report, today));
}
