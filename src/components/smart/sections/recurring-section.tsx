"use client";

import { PlusIcon, RepeatIcon } from "lucide-react";

import RecurringList from "@/components/smart/recurring-list";
import { NoWalletsEmpty, SectionEmpty } from "@/components/smart/sections/section-empty";
import { UpcomingCard } from "@/components/smart/upcoming-card";
import { Button } from "@/components/ui/button";
import { useTracker } from "@/context/tracker-context";

/** What's coming up this week, then every recurring item. */
export function RecurringSection() {
  const { data, dialogs } = useTracker();
  const add = () => dialogs.openEntry("recurring");

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recurring</h2>
        {data.wallets.length > 0 && data.recurring.length > 0 && (
          <Button variant="outline" size="sm" className="max-md:hidden" onClick={add}>
            <PlusIcon className="size-4" />
            Add Recurring
          </Button>
        )}
      </div>
      {data.wallets.length === 0 ? (
        <NoWalletsEmpty what="setting up recurring transactions" />
      ) : data.recurring.length === 0 ? (
        <SectionEmpty
          icon={<RepeatIcon />}
          title="No recurring transactions"
          description="Set up automatic income or expenses that repeat on a schedule."
          actionLabel="Add Recurring"
          onAction={add}
        />
      ) : (
        <>
          <UpcomingCard />
          <RecurringList />
        </>
      )}
    </>
  );
}
