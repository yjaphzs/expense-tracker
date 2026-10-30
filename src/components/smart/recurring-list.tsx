"use client";

import { useMemo, useState } from "react";
import { Trash2Icon } from "lucide-react";

import Paginator from "@/components/smart/paginator";
import { PageSizeSelect } from "@/components/smart/page-size-select";
import { RecurringRow } from "@/components/smart/recurring-row";
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
import { ItemGroup } from "@/components/ui/item";
import { useTracker } from "@/context/tracker-context";
import { FREQUENCY_LABELS } from "@/lib/recurring-schedule";
import { formatCurrency } from "@/lib/utils";
import type { RecurringTransaction } from "@/types/transaction";

/** Paginated recurring items; deleting one asks first (it stops future transactions). */
export default function RecurringList() {
  const { data, actions } = useTracker();
  const items = data.recurring;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  // One confirmation for the list; kept while the dialog animates closed.
  const [deleting, setDeleting] = useState<RecurringTransaction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const totalPages = Math.ceil(items.length / pageSize);
  const page = Math.min(currentPage, totalPages || 1);
  if (page !== currentPage) setCurrentPage(page);
  const paged = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);

  return (
    <>
      <div className="mt-4">
        <PageSizeSelect
          value={pageSize}
          onChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
      <ItemGroup className="mt-4 gap-2">
        {paged.map((item) => (
          <RecurringRow
            key={item.id}
            item={item}
            onDelete={(target) => {
              setDeleting(target);
              setConfirmOpen(true);
            }}
          />
        ))}
      </ItemGroup>
      <div className="mt-4">
        <Paginator currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <Trash2Icon className="mx-auto size-10 rounded-lg border bg-primary p-2 text-primary-foreground sm:mx-0" />
            <AlertDialogTitle>Delete this recurring transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (
                <>
                  This will stop future automatic transactions for{" "}
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
                    {formatCurrency(deleting.amount)} ({deleting.category}, {FREQUENCY_LABELS[deleting.frequency]})
                  </code>
                  . Previously created transactions will remain.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && actions.removeRecurring(deleting.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
