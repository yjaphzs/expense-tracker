import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightIcon, BanknoteIcon, CreditCardIcon } from "lucide-react";
import type { Wallet, Transaction } from "@/types/transaction";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Wallet[];
  onTransfer: (fromTx: Omit<Transaction, "id">, toTx: Omit<Transaction, "id">) => void;
}

const TransferDialog: React.FC<TransferDialogProps> = ({
  open,
  onOpenChange,
  wallets,
  onTransfer,
}) => {
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setFromWalletId("");
    setToWalletId("");
    setAmount("");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!fromWalletId || !toWalletId || fromWalletId === toWalletId || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const fromWallet = wallets.find((w) => w.id === fromWalletId);
    const toWallet = wallets.find((w) => w.id === toWalletId);
    const desc = description.trim() || `Transfer: ${fromWallet?.name ?? "?"} → ${toWallet?.name ?? "?"}`;

    onTransfer(
      {
        type: "expense",
        category: "Transfer",
        amount: parsedAmount,
        description: desc,
        date: dateStr,
        walletId: fromWalletId,
      },
      {
        type: "income",
        category: "Transfer",
        amount: parsedAmount,
        description: desc,
        date: dateStr,
        walletId: toWalletId,
      }
    );
    resetForm();
    onOpenChange(false);
  };

  const isValid =
    fromWalletId &&
    toWalletId &&
    fromWalletId !== toWalletId &&
    amount &&
    parseFloat(amount) > 0;

  const WalletIcon = ({ type }: { type: string }) =>
    type === "cash" ? <BanknoteIcon className="size-4" /> : <CreditCardIcon className="size-4" />;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Between Wallets</DialogTitle>
          <DialogDescription>
            Move funds from one wallet to another.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-muted-foreground">From</label>
              <Select value={fromWalletId} onValueChange={setFromWalletId}>
                <SelectTrigger>
                  <SelectValue placeholder="Source wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id} disabled={w.id === toWalletId}>
                      <span className="flex items-center gap-2">
                        <WalletIcon type={w.type} />
                        {w.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center pb-2">
              <ArrowRightIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-muted-foreground">To</label>
              <Select value={toWalletId} onValueChange={setToWalletId}>
                <SelectTrigger>
                  <SelectValue placeholder="Target wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                      <span className="flex items-center gap-2">
                        <WalletIcon type={w.type} />
                        {w.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Amount</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="font-mono"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Description <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Move savings to cash"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferDialog;
