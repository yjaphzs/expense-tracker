"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { APP_NAME, APP_URL } from "@/config/app";
import { useAuth } from "@/context/auth-provider";
import { useTracker } from "@/context/tracker-context";
import { transactionsToCsv } from "@/lib/csv-transactions";
import { downloadFile } from "@/lib/download";
import { buildReport } from "@/lib/export/aggregate";
import { inPeriod, resolvePeriod, type PeriodPreset } from "@/lib/export/period";
import { downloadWorkbook } from "@/lib/export/xlsx/workbook";
import { todayStr } from "@/lib/recurring-schedule";
import { printSummaryReport } from "@/lib/report/summary-report";

export type ExportKind = "excel" | "csv" | "print";

/** The period picked in "Export & print", the report built for it, and the three exports. */
export function useExportActions() {
  const { data } = useTracker();
  const { user, profile } = useAuth();
  const [preset, setPreset] = useState<PeriodPreset>("this-month");
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const today = todayStr();

  const report = useMemo(() => {
    const period = resolvePeriod(preset, new Date(), data.transactions);
    const preparedFor = profile?.displayName ?? user?.displayName ?? undefined;
    return buildReport({ transactions: data.transactions, wallets: data.wallets, budgets: data.budgets, period, preparedFor, today });
  }, [preset, data.transactions, data.wallets, data.budgets, profile?.displayName, user?.displayName, today]);

  const generatedOn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const slug = report.period.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const run = async (kind: ExportKind, task: () => Promise<void> | void) => {
    setBusy(kind);
    try {
      await task();
    } catch (err) {
      console.error(`[export] ${kind} failed:`, err);
      toast.error(kind === "excel" ? "Couldn't load the exporter. Check your connection and try again." : "Couldn't create the file.");
    } finally {
      setBusy(null);
    }
  };

  const exportExcel = () => run("excel", () => downloadWorkbook(report, generatedOn, today));

  // Includes both sides of transfers so a re-import or a spreadsheet sees every movement.
  const exportCsv = () =>
    run("csv", () => {
      const rows = data.transactions.filter((t) => inPeriod(t, report.period));
      // The BOM makes Excel read the file as UTF-8 (₱ and accented names).
      downloadFile(`﻿${transactionsToCsv(rows, data.wallets)}`, `expense-tracker-${slug}-${today}.csv`, "text/csv;charset=utf-8");
    });

  const print = () =>
    run("print", () => printSummaryReport(report, { appName: APP_NAME, appUrl: APP_URL || window.location.origin, generatedOn }));

  return { preset, setPreset, report, busy, exportExcel, exportCsv, print };
}
