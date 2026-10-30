"use client";

import type { ReactNode } from "react";
import { PlusIcon, WalletIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useTracker } from "@/context/tracker-context";

interface SectionEmptyProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

/** The dashed empty state used by every section. */
export function SectionEmpty({ icon = <WalletIcon />, title, description, actionLabel, onAction }: SectionEmptyProps) {
  return (
    <Empty className="mt-4 border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" className="max-md:h-10" onClick={onAction}>
          <PlusIcon className="size-4" /> {actionLabel}
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/** Income, Expenses and Recurring need a wallet first. */
export function NoWalletsEmpty({ what = "tracking transactions" }: { what?: string }) {
  const { dialogs } = useTracker();
  return (
    <SectionEmpty
      title="No Wallets Found"
      description={`You need to add a wallet before you can start ${what}.`}
      actionLabel="Add Wallet"
      onAction={() => dialogs.openWalletForm()}
    />
  );
}
