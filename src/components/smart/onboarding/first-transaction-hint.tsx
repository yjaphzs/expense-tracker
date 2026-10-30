"use client";

import { FileSpreadsheetIcon, PlusIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTracker } from "@/context/tracker-context";

/** Wallets are set up but nothing's recorded yet: point at the next step. */
export function FirstTransactionHint() {
  const { dialogs } = useTracker();
  return (
    <div className="mt-4 rounded-lg border border-dashed bg-muted/30 p-5 text-center">
      <SparklesIcon className="mx-auto size-6 text-primary" />
      <p className="mt-2 font-medium">You&apos;re set up</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first income or expense. You can also bring in transactions from a spreadsheet.
      </p>
      <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
        <Button className="max-md:h-11" onClick={() => dialogs.openEntry()}>
          <PlusIcon className="size-4" />
          Add your first transaction
        </Button>
        <Button variant="outline" className="max-md:h-11" onClick={() => dialogs.setCsvOpen(true)}>
          <FileSpreadsheetIcon className="size-4" />
          Import a CSV
        </Button>
      </div>
    </div>
  );
}
