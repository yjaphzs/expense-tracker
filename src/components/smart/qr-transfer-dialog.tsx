import React, { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    QrCodeIcon,
    ScanLineIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CameraIcon,
    CameraOffIcon,
} from "lucide-react";
import type { Transaction, Wallet, RecurringTransaction } from "@/types/transaction";

// QR code max safe payload (~2900 bytes binary). We use a conservative limit.
const QR_CHUNK_SIZE = 1800;

interface QrTransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transactions: Transaction[];
    wallets: Wallet[];
    recurring: RecurringTransaction[];
    autosave: boolean;
    onImport: (data: {
        transactions: Transaction[];
        wallets: Wallet[];
        recurring: RecurringTransaction[];
        autosave: boolean;
    }) => void;
}

function chunkString(str: string, size: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += size) {
        chunks.push(str.slice(i, i + size));
    }
    return chunks;
}

// --- Send (QR display) mode ---
function SendMode({ transactions, wallets, recurring, autosave }: {
    transactions: Transaction[];
    wallets: Wallet[];
    recurring: RecurringTransaction[];
    autosave: boolean;
}) {
    const [chunkIndex, setChunkIndex] = useState(0);

    const { chunks, compressed } = React.useMemo(() => {
        const payload = JSON.stringify({ transactions, wallets, recurring, autosave });
        const compressed = compressToEncodedURIComponent(payload);
        const chunks = chunkString(compressed, QR_CHUNK_SIZE);
        return { chunks, compressed };
    }, [transactions, wallets, recurring, autosave]);

    const totalChunks = chunks.length;

    const qrData = totalChunks === 1
        ? `ET1:${chunks[0]}`
        : `ET:${chunkIndex + 1}/${totalChunks}:${chunks[chunkIndex]}`;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                    value={qrData}
                    size={256}
                    level={totalChunks > 1 ? "L" : "M"}
                />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{transactions.length} transactions</Badge>
                <Badge variant="outline">{wallets.length} wallets</Badge>
                <Badge variant="outline">{recurring.length} recurring</Badge>
            </div>
            <p className="text-xs text-muted-foreground text-center">
                Compressed: {compressed.length.toLocaleString()} chars
                {totalChunks > 1 && ` • ${totalChunks} QR codes`}
            </p>
            {totalChunks > 1 && (
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        disabled={chunkIndex === 0}
                        onClick={() => setChunkIndex((i) => i - 1)}
                    >
                        <ChevronLeftIcon className="size-4" />
                    </Button>
                    <span className="text-sm tabular-nums font-medium">
                        {chunkIndex + 1} / {totalChunks}
                    </span>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        disabled={chunkIndex === totalChunks - 1}
                        onClick={() => setChunkIndex((i) => i + 1)}
                    >
                        <ChevronRightIcon className="size-4" />
                    </Button>
                </div>
            )}
            {totalChunks > 1 && (
                <p className="text-xs text-muted-foreground text-center">
                    Show each QR code one at a time for the receiving device to scan.
                </p>
            )}
        </div>
    );
}

// --- Receive (QR scan) mode ---
function ReceiveMode({ onImport, onClose }: {
    onImport: (data: {
        transactions: Transaction[];
        wallets: Wallet[];
        recurring: RecurringTransaction[];
        autosave: boolean;
    }) => void;
    onClose: () => void;
}) {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [receivedChunks, setReceivedChunks] = useState<Map<number, string>>(new Map());
    const [totalChunks, setTotalChunks] = useState<number | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef({ receivedChunks: new Map<number, string>(), totalChunks: null as number | null });

    const processComplete = useCallback((compressed: string) => {
        try {
            const json = decompressFromEncodedURIComponent(compressed);
            if (!json) throw new Error("Decompression failed");
            const data = JSON.parse(json);

            if (!Array.isArray(data.transactions) || !Array.isArray(data.wallets) || !Array.isArray(data.recurring)) {
                throw new Error("Invalid data structure");
            }

            onImport(data);
            onClose();
        } catch {
            setError("Failed to decode QR data. Make sure you scanned all codes from the sending device.");
        }
    }, [onImport, onClose]);

    const handleScanResult = useCallback((text: string) => {
        setError(null);

        // Single-chunk format: ET1:<data>
        if (text.startsWith("ET1:")) {
            const compressed = text.slice(4);
            processComplete(compressed);
            return;
        }

        // Multi-chunk format: ET:<index>/<total>:<data>
        const match = text.match(/^ET:(\d+)\/(\d+):(.+)$/);
        if (!match) {
            setError("Unrecognized QR code format.");
            return;
        }

        const idx = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);
        const chunk = match[3];

        stateRef.current.totalChunks = total;
        stateRef.current.receivedChunks.set(idx, chunk);

        setTotalChunks(total);
        setReceivedChunks(new Map(stateRef.current.receivedChunks));

        if (stateRef.current.receivedChunks.size === total) {
            // All chunks received — reassemble
            let compressed = "";
            for (let i = 1; i <= total; i++) {
                compressed += stateRef.current.receivedChunks.get(i) ?? "";
            }
            processComplete(compressed);
        }
    }, [processComplete]);

    const startScanner = useCallback(async () => {
        if (!containerRef.current) return;
        setError(null);
        setReceivedChunks(new Map());
        setTotalChunks(null);
        stateRef.current = { receivedChunks: new Map(), totalChunks: null };

        try {
            const scanner = new Html5Qrcode("qr-reader");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => handleScanResult(decodedText),
                () => {} // ignore errors during scanning
            );
            setScanning(true);
        } catch {
            setError("Could not access camera. Please grant camera permission and try again.");
        }
    }, [handleScanResult]);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch { /* ignore */ }
            scannerRef.current = null;
        }
        setScanning(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {});
                scannerRef.current = null;
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                id="qr-reader"
                ref={containerRef}
                className="w-full max-w-[300px] aspect-square rounded-lg overflow-hidden bg-muted"
                style={{ display: scanning ? "block" : "none" }}
            />

            {!scanning && (
                <div className="w-full max-w-[300px] aspect-square rounded-lg bg-muted flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <ScanLineIcon className="size-12 mx-auto mb-2" />
                        <p className="text-sm">Press Start to open camera</p>
                    </div>
                </div>
            )}

            {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {totalChunks !== null && totalChunks > 1 && (
                <div className="text-sm text-muted-foreground text-center">
                    Scanned {receivedChunks.size} / {totalChunks} QR codes
                </div>
            )}

            <Button
                variant={scanning ? "destructive" : "default"}
                size="sm"
                onClick={scanning ? stopScanner : startScanner}
            >
                {scanning ? (
                    <><CameraOffIcon className="size-4" /> Stop Camera</>
                ) : (
                    <><CameraIcon className="size-4" /> Start Camera</>
                )}
            </Button>
        </div>
    );
}

// --- Main Dialog ---
const QrTransferDialog: React.FC<QrTransferDialogProps> = ({
    open,
    onOpenChange,
    transactions,
    wallets,
    recurring,
    autosave,
    onImport,
}) => {
    const [mode, setMode] = useState<"send" | "receive">("send");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Transfer</DialogTitle>
                    <DialogDescription>
                        {mode === "send"
                            ? "Show this QR code on the sending device. Scan it with the receiving device."
                            : "Scan the QR code from the sending device to import data."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center gap-2 mb-2">
                    <Button
                        variant={mode === "send" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMode("send")}
                    >
                        <QrCodeIcon className="size-4" /> Send
                    </Button>
                    <Button
                        variant={mode === "receive" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMode("receive")}
                    >
                        <ScanLineIcon className="size-4" /> Receive
                    </Button>
                </div>

                {mode === "send" ? (
                    <SendMode
                        transactions={transactions}
                        wallets={wallets}
                        recurring={recurring}
                        autosave={autosave}
                    />
                ) : (
                    <ReceiveMode
                        onImport={onImport}
                        onClose={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default QrTransferDialog;
