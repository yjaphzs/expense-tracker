import { PlusIcon, UtensilsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** A few real controls in the current colors, so a choice can be judged before closing. */
export function AppearancePreview() {
  return (
    <div aria-hidden className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <UtensilsIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Food</p>
          <p className="text-xs text-muted-foreground">Lunch with friends</p>
        </div>
        <p className="font-mono text-lg font-bold tabular-nums">₱ 245.00</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Food budget</span>
            <span className="tabular-nums">62%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[62%] rounded-full bg-primary" />
          </div>
        </div>
        <Button size="sm" tabIndex={-1}>
          <PlusIcon />
          Add
        </Button>
      </div>
    </div>
  );
}
