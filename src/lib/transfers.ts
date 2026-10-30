import type { Transaction, Wallet } from "@/types/transaction";
import { TRANSFER_CATEGORY } from "@/types/transaction";

export interface TransferInput {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  description: string;
  date: string;
}

/** "Transfer: GCash → Cash" when the user leaves the description empty. */
export function defaultTransferDescription(wallets: Wallet[], input: Pick<TransferInput, "fromWalletId" | "toWalletId">) {
  const name = (id: string) => wallets.find((w) => w.id === id)?.name ?? "?";
  return `Transfer: ${name(input.fromWalletId)} → ${name(input.toWalletId)}`;
}

/**
 * The two legs of a transfer: an expense on the source wallet and income on
 * the destination, sharing `transferId`. They move balances but never count as
 * income or spending.
 */
export function buildTransferLegs(
  input: TransferInput,
  transferId: string,
  description: string,
): [Omit<Transaction, "id">, Omit<Transaction, "id">] {
  const base = {
    category: TRANSFER_CATEGORY,
    amount: input.amount,
    description,
    date: input.date,
    transfer: true,
    transferId,
  };
  return [
    { ...base, type: "expense", walletId: input.fromWalletId },
    { ...base, type: "income", walletId: input.toWalletId },
  ];
}

/** The transfer's two legs ordered [from, to], or null when the partner is gone. */
export function orderLegs(leg: Transaction, partner: Transaction | undefined): [Transaction, Transaction] | null {
  if (!partner) return null;
  return leg.type === "expense" ? [leg, partner] : [partner, leg];
}

/** Form values for editing an existing transfer pair. */
export function transferInputFrom([from, to]: [Transaction, Transaction]): TransferInput {
  return {
    fromWalletId: from.walletId,
    toWalletId: to.walletId,
    amount: from.amount,
    description: from.description,
    date: from.date,
  };
}
