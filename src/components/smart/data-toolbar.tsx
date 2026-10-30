"use client";

import { MoreHorizontalIcon, PlusIcon, RotateCcw } from "lucide-react";

import { ResponsiveMenu } from "@/components/shared/responsive-menu";
import { dataMenuGroups } from "@/components/smart/data-menu-groups";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useTracker } from "@/context/tracker-context";

/** Desktop: Add Transaction, Reset and ⋯. Phones: just ⋯ (Add is the floating button). */
export default function DataToolbar() {
  const tracker = useTracker();
  const { dialogs } = tracker;

  return (
    <>
      <ButtonGroup className="hidden md:flex">
        <Button variant="outline" size="sm" onClick={() => dialogs.openEntry()}>
          <PlusIcon className="size-4" />
          Add Transaction
        </Button>
        <Button variant="outline" size="sm" onClick={() => dialogs.setResetOpen(true)}>
          <RotateCcw className="size-4" />
          Reset
        </Button>
        <ResponsiveMenu
          mode="menu"
          title="Data options"
          groups={dataMenuGroups(tracker, false)}
          trigger={
            <Button variant="outline" size="icon-sm" aria-label="More Options">
              <MoreHorizontalIcon />
            </Button>
          }
        />
      </ButtonGroup>
      <div className="md:hidden">
        <ResponsiveMenu
          mode="sheet"
          title="Data options"
          groups={dataMenuGroups(tracker, true)}
          trigger={
            <Button variant="outline" size="icon" className="size-10" aria-label="More Options">
              <MoreHorizontalIcon />
            </Button>
          }
        />
      </div>
    </>
  );
}
