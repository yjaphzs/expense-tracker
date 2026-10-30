"use client";

import dynamic from "next/dynamic";
import { RotateCcw } from "lucide-react";

import EditRecurringDialog from "@/components/smart/add-recurring-dialog";
import TransactionDialog from "@/components/smart/add-transaction-dialog";
import BudgetsDialog from "@/components/smart/budgets/budgets-dialog";
import CategoriesDialog from "@/components/smart/categories/categories-dialog";
import CsvImportDialog from "@/components/smart/csv-import-dialog";
import ManageWalletsDialog from "@/components/smart/manage-wallets-dialog";
import { MergeDialog } from "@/components/smart/merge-dialog";
import TransferDialog from "@/components/smart/transfer-dialog";
import WalletFormDialog from "@/components/smart/wallet-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTracker } from "@/context/tracker-context";

// QR codes and the camera scanner: only downloaded once QR Transfer is opened.
const QrTransferDialog = dynamic(() => import("@/components/smart/qr/qr-transfer-dialog"), { ssr: false });

/** Every overlay the tracker can open, in one place. Which one is open lives in useTrackerDialogs. */
export function TrackerDialogs() {
  const { data, dialogs, actions } = useTracker();

  return (
    <>
      <TransactionDialog />
      <EditRecurringDialog />
      <TransferDialog />
      <ManageWalletsDialog />
      <WalletFormDialog />
      <CategoriesDialog />
      <BudgetsDialog />
      <CsvImportDialog />
      {dialogs.qr.used && <QrTransferDialog />}
      <MergeDialog conflict={data.pendingMerge} onResolve={data.resolveMerge} />

      <AlertDialog open={dialogs.resetOpen} onOpenChange={dialogs.setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <RotateCcw className="mx-auto size-10 rounded-lg border bg-primary p-2 text-primary-foreground sm:mx-0" />
            <AlertDialogTitle>Reset all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your transactions, recurring transactions,
              budgets, categories, and wallets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={actions.reset}>
              Continue Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
