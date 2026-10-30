"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTracker } from "@/context/tracker-context";
import { encodeFrames } from "@/lib/qr-frames";

/** Shows this device's data as one or more QR codes for another device to scan. */
export function SendMode() {
  const { data } = useTracker();
  const { transactions, recurring, wallets, budgets, categories, autosave } = data;
  const [index, setIndex] = useState(0);
  const { frames, compressedLength } = useMemo(
    () => encodeFrames({ transactions, recurring, wallets, budgets, categories, autosave }),
    [transactions, recurring, wallets, budgets, categories, autosave],
  );
  const total = frames.length;
  const current = Math.min(index, total - 1);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="max-w-full rounded-lg bg-white p-4">
        <QRCodeSVG value={frames[current]} size={256} className="h-auto max-w-full" level={total > 1 ? "L" : "M"} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">{transactions.length} transactions</Badge>
        <Badge variant="outline">{wallets.length} wallets</Badge>
        <Badge variant="outline">{recurring.length} recurring</Badge>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Compressed: {compressedLength.toLocaleString()} chars
        {total > 1 && ` • ${total} QR codes`}
      </p>
      {total > 1 && (
        <>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon-sm"
              className="max-md:size-10"
              aria-label="Previous QR code"
              disabled={current === 0}
              onClick={() => setIndex(current - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-sm font-medium tabular-nums">
              {current + 1} / {total}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              className="max-md:size-10"
              aria-label="Next QR code"
              disabled={current === total - 1}
              onClick={() => setIndex(current + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Show each QR code one at a time for the receiving device to scan.
          </p>
        </>
      )}
    </div>
  );
}
