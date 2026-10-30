"use client";

import { DownloadIcon, ShareIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

/** "Install Expense Tracker" for returning visitors; remembered once dismissed. */
export function InstallBanner() {
  const { visible, ios, canPrompt, install, dismiss } = useInstallPrompt();
  if (!visible || (!ios && !canPrompt)) return null;

  return (
    <aside
      aria-label="Install the app"
      className="mt-4 flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4"
    >
      <DownloadIcon className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Install Expense Tracker</p>
        {ios ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Tap <ShareIcon aria-label="Share" className="inline size-4 align-text-bottom" />, then{" "}
            <span className="font-medium text-foreground">Add to Home Screen</span> to open it like an app, even offline.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Open it from your home screen like an app, even offline.</p>
        )}
        {canPrompt && (
          <Button size="sm" className="mt-3 max-md:h-10" onClick={install}>
            Install
          </Button>
        )}
      </div>
      <Button variant="ghost" size="icon-sm" className="max-md:size-10" aria-label="Not now" onClick={dismiss}>
        <XIcon />
      </Button>
    </aside>
  );
}
