"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import { useTracker } from "@/context/tracker-context";

/** Placeholder while the Analytics code loads (first visit to the tab only). */
function AnalyticsLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading analytics">
      <Skeleton className="h-9 w-full max-w-sm" />
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[250px] w-full" />
    </div>
  );
}

// Charts and the export/print tools are the heaviest parts of the app, so they
// load the first time this tab is opened, not with the page.
const Analytics = dynamic(() => import("@/components/smart/analytics"), { ssr: false, loading: () => <AnalyticsLoading /> });
const ExportPanel = dynamic(() => import("@/components/smart/export/export-panel"), { ssr: false });

export function AnalyticsSection() {
  const { data } = useTracker();
  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics</h2>
      </div>
      <Analytics transactions={data.transactions} wallets={data.wallets} />
      <div className="mt-6">
        <ExportPanel />
      </div>
    </>
  );
}
