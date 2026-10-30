import { rangeLabel } from "@/lib/export/period";
import { EXPORT_COLORS as C } from "@/lib/export/theme";
import type { ReportData } from "@/lib/export/aggregate";
import type { SheetWriter } from "@/lib/export/xlsx/sheet-builder";

const band = (sz: number, bold: boolean, color: string) => ({
  font: { sz, bold, color: { rgb: color } },
  fill: { fgColor: { rgb: C.ink } },
  alignment: { vertical: "center", indent: 1 },
});

/**
 * The top of every sheet, as in the printable report: a dark band with the app
 * and sheet name, the period, a thin amber stripe, then who it's for and when.
 * Returns the first free row.
 */
export function writeSheetHeader(sheet: SheetWriter, title: string, report: ReportData, generatedOn: string): number {
  sheet.line(0, `Expense Tracker  ·  ${title}`, band(14, true, C.white), 30);
  sheet.line(1, `${report.period.label}  ·  ${rangeLabel(report.period)}`, band(10, false, C.bandText), 20);
  sheet.line(2, "", { fill: { fgColor: { rgb: C.stripe } } }, 4);
  const who = report.preparedFor ? `Prepared for ${report.preparedFor}  ·  ` : "";
  sheet.line(3, `${who}Generated ${generatedOn}`, { font: { sz: 9, color: { rgb: C.muted } }, alignment: { vertical: "center" } }, 18);
  return 5;
}

/** A small bold heading above a table on the Summary sheet. */
export function writeSectionTitle(sheet: SheetWriter, row: number, title: string): number {
  sheet.set(row, 0, { v: title, t: "s", s: { font: { sz: 12, bold: true, color: { rgb: C.ink } } } });
  sheet.rowHeights[row] = { hpt: 22 };
  return row + 1;
}
