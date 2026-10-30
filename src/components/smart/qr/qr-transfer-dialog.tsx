"use client";

import { useState } from "react";
import { QrCodeIcon, ScanLineIcon } from "lucide-react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { ReceiveMode } from "@/components/smart/qr/receive-mode";
import { SendMode } from "@/components/smart/qr/send-mode";
import { Button } from "@/components/ui/button";
import { useTracker } from "@/context/tracker-context";

/** Move everything to another device by QR code: Send shows codes, Receive scans them. */
export default function QrTransferDialog() {
  const { data, dialogs, actions } = useTracker();
  // A device without data most likely wants to receive.
  const [mode, setMode] = useState<"send" | "receive">(() => (data.transactions.length === 0 ? "receive" : "send"));

  const receive = (payload: unknown) => {
    actions.importQr(payload);
    dialogs.setQrOpen(false);
  };

  return (
    <ResponsiveDialog open={dialogs.qr.open} onOpenChange={dialogs.setQrOpen}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>QR Transfer</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {mode === "send"
              ? "Show this QR code on the sending device. Scan it with the receiving device."
              : "Scan the QR code from the sending device to import data."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="grid gap-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-0">
          <div role="group" aria-label="Mode" className="mb-2 flex justify-center gap-2">
            {(["send", "receive"] as const).map((value) => (
              <Button
                key={value}
                aria-pressed={mode === value}
                variant={mode === value ? "default" : "outline"}
                size="sm"
                className="max-md:h-10"
                onClick={() => setMode(value)}
              >
                {value === "send" ? <QrCodeIcon className="size-4" /> : <ScanLineIcon className="size-4" />}
                {value === "send" ? "Send" : "Receive"}
              </Button>
            ))}
          </div>
          {mode === "send" ? <SendMode /> : <ReceiveMode onPayload={receive} />}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
