"use client";

import { FileSpreadsheetIcon, FileTextIcon, LoaderCircleIcon, PrinterIcon, type LucideIcon } from "lucide-react";

import { useExportActions, type ExportKind } from "@/components/smart/export/use-export-actions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERIOD_PRESETS, rangeLabel, type PeriodPreset } from "@/lib/export/period";
import { formatCurrency } from "@/lib/utils";

/** Analytics: pick a period, then download Excel or CSV, or print a Summary Report (or save it as PDF). */
export default function ExportPanel() {
  const { preset, setPreset, report, busy, exportExcel, exportCsv, print } = useExportActions();
  const { income, expense, net, count } = report.totals;
  const empty = count === 0;

  const action = (kind: ExportKind, label: string, Icon: LucideIcon, onClick: () => void) => (
    <Button variant="outline" size="sm" className="max-md:h-10" disabled={empty || busy !== null} onClick={onClick}>
      {busy === kind ? <LoaderCircleIcon className="size-4 animate-spin" /> : <Icon className="size-4" />}
      {label}
    </Button>
  );

  return (
    <section aria-labelledby="export-heading" className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/30 p-4">
      <h3 id="export-heading" className="flex items-center gap-2 text-sm font-semibold">
        <FileSpreadsheetIcon className="size-4" />
        Export &amp; print
      </h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={preset} onValueChange={(value) => setPreset(value as PeriodPreset)}>
          <SelectTrigger aria-label="Period" className="w-full max-md:h-10 sm:w-[180px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_PRESETS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {rangeLabel(report.period)} · {count} transaction{count === 1 ? "" : "s"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        {action("excel", "Excel", FileSpreadsheetIcon, exportExcel)}
        {action("csv", "CSV", FileTextIcon, exportCsv)}
        {action("print", "Print or save as PDF", PrinterIcon, print)}
      </div>
      {empty ? (
        <p className="text-xs text-muted-foreground">No income or expenses in this period.</p>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Income: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(income)}</strong></span>
          <span>Expenses: <strong className="text-red-600 dark:text-red-400">{formatCurrency(expense)}</strong></span>
          <span>Net: <strong className={net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>{formatCurrency(net)}</strong></span>
        </div>
      )}
    </section>
  );
}
