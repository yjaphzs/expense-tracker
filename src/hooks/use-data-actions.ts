"use client";

import { toast } from "sonner";

import type { TrackerData } from "@/hooks/use-tracker-data";
import type { CsvImportResult } from "@/lib/csv-transactions";
import { downloadFile, pickTextFile } from "@/lib/download";
import { ImportError, serializeBackup, validateBackup } from "@/lib/import-validation";
import { todayStr } from "@/lib/recurring-schedule";
import type { TrackerState } from "@/types";

/** Save, backups (JSON and QR), CSV import and reset, with their toasts. */
export function useDataActions(data: TrackerData) {
  const state = (): TrackerState => ({
    transactions: data.transactions,
    recurring: data.recurring,
    wallets: data.wallets,
    budgets: data.budgets,
    categories: data.categories,
    autosave: data.autosave,
  });

  const save = () => {
    data.persistNow();
    toast.success("Data has been saved!");
  };

  const exportBackup = () => {
    const filename = `expense-tracker-backup-${todayStr()}.json`;
    try {
      downloadFile(serializeBackup(state()), filename, "application/json");
      toast.success("Backup downloaded", { description: filename });
    } catch {
      toast.error("Couldn't create the backup file.");
    }
  };

  const importBackup = async () => {
    const file = await pickTextFile(".json,application/json");
    if (!file) return;
    try {
      data.replaceAll(validateBackup(JSON.parse(file.text)));
      toast.success("Backup imported");
    } catch (err) {
      toast.error("Couldn't import that file", {
        description: err instanceof ImportError ? err.message : "It isn't a valid Expense Tracker backup.",
      });
    }
  };

  /** QR payloads may lack the autosave flag; keep the current setting then. */
  const importQr = (payload: unknown) => {
    try {
      data.replaceAll(validateBackup(payload, data.autosave));
      toast.success("Data imported via QR transfer!");
    } catch (err) {
      toast.error("Couldn't import that QR code", { description: err instanceof Error ? err.message : undefined });
    }
  };

  /** Appends a previewed CSV import; Undo takes back the rows and any wallets or categories it created. */
  const importCsv = (result: CsvImportResult) => {
    if (result.newWallets.length) data.setWallets((prev) => [...prev, ...result.newWallets]);
    if (result.newCategories.length) data.setCategories((prev) => [...prev, ...result.newCategories]);
    const added = data.addTransactions(result.transactions);
    const plural = added.length === 1 ? "" : "s";
    toast.success(`Imported ${added.length} transaction${plural}`, {
      action: {
        label: "Undo",
        onClick: () => {
          data.removeByIds(added.map((t) => t.id));
          const walletIds = new Set(result.newWallets.map((w) => w.id));
          const categoryIds = new Set(result.newCategories.map((c) => c.id));
          if (walletIds.size) data.setWallets((prev) => prev.filter((w) => !walletIds.has(w.id)));
          if (categoryIds.size) data.setCategories((prev) => prev.filter((c) => !categoryIds.has(c.id)));
        },
      },
    });
  };

  const reset = () => {
    data.removeAll();
    toast.success("All data has been reset.");
  };

  return { save, exportBackup, importBackup, importQr, importCsv, reset };
}

export type DataActions = ReturnType<typeof useDataActions>;
