import React, { useId, useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { FormDialogActions } from "@/components/shared/form-dialog-actions";
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
import { TRANSFER_CATEGORY } from "@/types/transaction";

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
  const formId = useId();
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
    const transferId = crypto.randomUUID();

    onTransfer(
      {
        type: "expense",
        category: TRANSFER_CATEGORY,
        amount: parsedAmount,
        description: desc,
        date: dateStr,
        walletId: fromWalletId,
        transfer: true,
        transferId,
      },
      {
        type: "income",
        category: TRANSFER_CATEGORY,
        amount: parsedAmount,
        description: desc,
        date: dateStr,
        walletId: toWalletId,
        transfer: true,
        transferId,
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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Transfer Between Wallets</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Move funds from one wallet to another.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* From and To sit side by side from sm up, stacked on phones. */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-2">
            <div className="flex flex-col gap-2 flex-1">
              <label htmlFor={`${formId}-from`} className="text-sm font-medium text-muted-foreground">From</label>
              <Select value={fromWalletId} onValueChange={setFromWalletId}>
                <SelectTrigger id={`${formId}-from`}>
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
            <div className="flex items-center justify-center pt-2 sm:pt-0 sm:pb-2" aria-hidden>
              <ArrowRightIcon className="size-5 rotate-90 text-muted-foreground sm:rotate-0" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label htmlFor={`${formId}-to`} className="text-sm font-medium text-muted-foreground">To</label>
              <Select value={toWalletId} onValueChange={setToWalletId}>
                <SelectTrigger id={`${formId}-to`}>
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
            <label htmlFor={`${formId}-amount`} className="text-sm font-medium text-muted-foreground">Amount</label>
            <Input
              id={`${formId}-amount`}
              type="number"
              inputMode="decimal"
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
            <label htmlFor={`${formId}-description`} className="text-sm font-medium text-muted-foreground">
              Description <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <Input
              id={`${formId}-description`}
              type="text"
              placeholder="e.g. Move savings to cash"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

        </form>
        </ResponsiveDialogBody>
        <FormDialogActions formId={formId} submitLabel="Transfer" disabled={!isValid} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default TransferDialog;
