"use client";

import { CloudAlertIcon, CloudCheckIcon, CloudOffIcon, CloudUploadIcon, type LucideIcon } from "lucide-react";

import { useSyncStatus, type SyncState } from "@/lib/sync-status";
import { cn } from "@/lib/utils";

const COPY: Record<SyncState, { icon: LucideIcon; text: string; tone: string }> = {
  idle: { icon: CloudCheckIcon, text: "All changes saved", tone: "text-primary" },
  saved: { icon: CloudCheckIcon, text: "All changes saved", tone: "text-primary" },
  saving: { icon: CloudUploadIcon, text: "Saving…", tone: "text-muted-foreground" },
  offline: { icon: CloudOffIcon, text: "Offline. Changes sync when you're back online.", tone: "text-amber-600 dark:text-amber-400" },
  error: { icon: CloudAlertIcon, text: "Couldn't save your latest changes", tone: "text-destructive" },
};

/** Where the signed-in user's changes are: saved, saving, waiting for a connection, or failed. */
export function SyncStatusLine() {
  const { state, nearlyFull } = useSyncStatus();
  const { icon: Icon, text, tone } = COPY[state];
  return (
    <span className="mt-1 flex flex-col gap-0.5" aria-live="polite">
      <span className={cn("inline-flex w-fit items-start gap-1 text-xs", tone)}>
        <Icon className="mt-0.5 size-3 shrink-0" />
        {text}
      </span>
      {nearlyFull && (
        <span className="text-xs text-amber-600 dark:text-amber-400">Your data is close to the storage limit.</span>
      )}
    </span>
  );
}

/** A dot on the avatar while changes aren't safely saved (offline or failed). */
export function SyncAttentionDot() {
  const { state, nearlyFull } = useSyncStatus();
  if (state !== "offline" && state !== "error" && !nearlyFull) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background",
        state === "error" ? "bg-destructive" : "bg-amber-500",
      )}
    />
  );
}
