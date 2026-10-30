"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraIcon, CameraOffIcon, ScanLineIcon } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";

import { Button } from "@/components/ui/button";
import { decodeFrames, parseFrame } from "@/lib/qr-frames";

interface ReceiveModeProps {
  /** Called once every frame is in, with the decoded payload (validated by the caller). */
  onPayload: (payload: unknown) => void;
}

/** Scans the sending device's QR codes with the camera (the scanner library loads on Start). */
export function ReceiveMode({ onPayload }: ReceiveModeProps) {
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ received: number; total: number } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const framesRef = useRef(new Map<number, string>());

  const handleScan = useCallback(
    (text: string) => {
      const frame = parseFrame(text);
      if (!frame) return setError("Unrecognized QR code format.");
      setError(null);
      framesRef.current.set(frame.index, frame.data);
      setProgress({ received: framesRef.current.size, total: frame.total });
      if (framesRef.current.size < frame.total) return;
      try {
        onPayload(decodeFrames(framesRef.current, frame.total));
      } catch {
        setError("Failed to decode QR data. Make sure you scanned all codes from the sending device.");
      }
    },
    [onPayload],
  );

  const start = () => {
    setError(null);
    setProgress(null);
    framesRef.current = new Map();
    setStarting(true);
  };

  // Start the camera once the reader container is visible.
  useEffect(() => {
    if (!starting || scanning) return;
    let cancelled = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, handleScan, () => {});
        if (cancelled) return void scanner.stop().catch(() => {});
        setScanning(true);
      } catch {
        if (cancelled) return;
        setError("Could not access camera. Please grant camera permission and try again.");
        setStarting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [starting, scanning, handleScan]);

  const stop = async () => {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      /* already stopped */
    }
    scannerRef.current = null;
    setScanning(false);
    setStarting(false);
  };

  useEffect(
    () => () => {
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    },
    [],
  );

  const active = starting || scanning;
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id="qr-reader"
        className="aspect-square w-full overflow-hidden rounded-lg bg-muted [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover"
        style={{ display: active ? "block" : "none" }}
      />
      {!active && (
        <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted">
          <div className="text-center text-muted-foreground">
            <ScanLineIcon className="mx-auto mb-2 size-12" />
            <p className="text-sm">Press Start to open camera</p>
          </div>
        </div>
      )}
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      {progress && progress.total > 1 && (
        <p className="text-center text-sm text-muted-foreground">
          Scanned {progress.received} / {progress.total} QR codes
        </p>
      )}
      <Button variant={scanning ? "destructive" : "default"} size="sm" className="max-md:h-10" disabled={starting && !scanning} onClick={scanning ? stop : start}>
        {scanning ? (
          <>
            <CameraOffIcon className="size-4" /> Stop Camera
          </>
        ) : (
          <>
            <CameraIcon className="size-4" /> Start Camera
          </>
        )}
      </Button>
    </div>
  );
}
