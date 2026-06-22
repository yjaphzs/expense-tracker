import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder shown while tracker data is loading (auth resolving / cloud sync
 * fetching), so the user never sees a flash of the empty state on reload.
 * Mirrors the real home layout: tabs, balance summary, wallets, transactions.
 */
export function TrackerSkeleton() {
  return (
    <div className="flex flex-col" aria-hidden>
      {/* Tabs */}
      <div className="mt-2 flex w-fit gap-1 rounded-lg bg-muted/50 p-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>

      {/* Balance summary card */}
      <div className="mt-6 flex flex-col gap-6 rounded-xl border p-6">
        <div className="flex items-start justify-between">
          <Skeleton className="size-9 rounded-md" />
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>

      {/* Wallets */}
      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="size-9 rounded-md" />
      </div>
      <div className="mt-3 flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-3.5 w-12" />
        </div>
      </div>

      {/* Recent transactions */}
      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border p-4"
          >
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
