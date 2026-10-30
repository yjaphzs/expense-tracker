"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheetIcon } from "lucide-react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { useTracker } from "@/context/tracker-context";
import { CsvFormatError, parseTransactionsCsv, type CsvImportResult } from "@/lib/csv-transactions";
import { pickTextFile } from "@/lib/download";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Adds transactions from a CSV after showing what will happen. Nothing is replaced. */
export default function CsvImportDialog() {
  const { data, dialogs, actions } = useTracker();
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dialogs.csvOpen) return;
    setResult(null);
    setError(null);
  }, [dialogs.csvOpen]);

  const choose = async () => {
    const file = await pickTextFile(".csv,text/csv");
    if (!file) return;
    setFileName(file.name);
    try {
      setResult(parseTransactionsCsv(file.text, data.wallets, data.categories));
      setError(null);
    } catch (err) {
      setResult(null);
      setError(err instanceof CsvFormatError ? err.message : "That file couldn't be read as CSV.");
    }
  };

  const confirm = () => {
    if (!result) return;
    actions.importCsv(result);
    dialogs.setCsvOpen(false);
  };

  const count = result?.transactions.length ?? 0;
  return (
    <ResponsiveDialog open={dialogs.csvOpen} onOpenChange={dialogs.setCsvOpen}>
      <ResponsiveDialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Import from CSV</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Adds transactions to what you already have. The first row must name the columns: Date, Type, Category,
            Amount, Wallet, and optionally Description.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="flex flex-col gap-4">
          <Button variant="outline" className="max-md:h-11" onClick={choose}>
            <FileSpreadsheetIcon className="size-4" />
            {result || error ? "Choose another file" : "Choose a CSV file"}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {result && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm" aria-live="polite">
              <p className="font-medium">{fileName}</p>
              <ul className="mt-2 flex flex-col gap-1 text-muted-foreground">
                <li>{plural(count, "transaction")} ready to add</li>
                {result.newWallets.length > 0 && (
                  <li>
                    {plural(result.newWallets.length, "new wallet")}: {result.newWallets.map((w) => w.name).join(", ")}
                  </li>
                )}
                {result.newCategories.length > 0 && (
                  <li>
                    {plural(result.newCategories.length, "new category", "new categories")}:{" "}
                    {result.newCategories.map((c) => c.name).join(", ")}
                  </li>
                )}
                {result.skipped.length > 0 && <li>{plural(result.skipped.length, "row")} skipped:</li>}
              </ul>
              {result.skipped.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                  {result.skipped.slice(0, 5).map((skip) => (
                    <li key={skip.row}>
                      Row {skip.row}: {skip.reason}
                    </li>
                  ))}
                  {result.skipped.length > 5 && <li>and {result.skipped.length - 5} more</li>}
                </ul>
              )}
            </div>
          )}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button className="max-md:h-11" disabled={count === 0} onClick={confirm}>
            {count > 0 ? `Add ${plural(count, "transaction")}` : "Add transactions"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
