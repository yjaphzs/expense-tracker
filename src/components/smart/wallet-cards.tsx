import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  BanknoteIcon,
  WalletIcon,
  PlusIcon,
  Trash2Icon,
  SettingsIcon,
  ImportIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from "lucide-react";
import type { Wallet, WalletType } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";

const WALLET_TYPE_ICON: Record<WalletType, React.ReactNode> = {
  cash: <BanknoteIcon className="size-4" />,
  "e-wallet-card": <WalletIcon className="size-4" />,
};

interface WalletCardsProps {
  wallets: Wallet[];
  walletBalances: Record<string, { income: number; expenses: number; balance: number }>;
  onAddWallet: (name: string, type: WalletType) => void;
  onRemoveWallet: (id: string) => void;
  hasTransactions: (walletId: string) => boolean;
  manageOpen?: boolean;
  onManageOpenChange?: (open: boolean) => void;
  dialogsOnly?: boolean;
  onImport?: () => void;
}

const WalletCards: React.FC<WalletCardsProps> = ({
  wallets,
  walletBalances,
  onAddWallet,
  onRemoveWallet,
  hasTransactions,
  manageOpen: manageOpenProp,
  onManageOpenChange,
  dialogsOnly = false,
  onImport,
}) => {
  const [manageOpenInternal, setManageOpenInternal] = useState(false);
  const manageOpen = manageOpenProp ?? manageOpenInternal;
  const setManageOpen = onManageOpenChange ?? setManageOpenInternal;
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<WalletType>("e-wallet-card");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddWallet(newName, newType);
    setNewName("");
    setNewType("e-wallet-card");
    setAddOpen(false);
  };

  return (
    <>
      {!dialogsOnly && (
        <>
          <div className="flex items-center justify-between mt-6 mb-3">
            <h2 className="text-lg font-semibold">Wallets</h2>
            <Button variant="outline" size="icon-sm" onClick={() => setManageOpen(true)}>
              <SettingsIcon className="size-4" />
            </Button>
          </div>

          {wallets.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <WalletIcon />
                </EmptyMedia>
                <EmptyTitle>No wallets yet</EmptyTitle>
                <EmptyDescription>
                  Add a wallet to start tracking your balances separately. You can have different wallets for cash, credit cards, or e-wallets.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-row gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                    <PlusIcon className="size-4" />
                    Add Wallet
                  </Button>
                  {onImport && (
                    <Button variant="outline" size="sm" onClick={onImport}>
                      <ImportIcon className="size-4" />
                      Import Data
                    </Button>
                  )}
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <div className={`grid grid-cols-1 gap-3 ${wallets.length === 1 ? "sm:grid-cols-1" : wallets.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {wallets.map((w) => {
                const bal = walletBalances[w.id] ?? { balance: 0, income: 0, expenses: 0 };
                return (
                  <div
                    key={w.id}
                    className="flex flex-col gap-1 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {WALLET_TYPE_ICON[w.type] ?? <WalletIcon className="size-4" />}
                      <span className="text-xs font-medium truncate">{w.name}</span>
                    </div>
                    <div className="text-lg font-mono font-bold">
                      {formatCurrency(bal.balance)}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        <ChevronUpIcon className="inline-block size-3 mr-1"/>
                        {formatCurrency(bal.income)}
                      </span>
                      <span className="text-[10px] font-mono text-red-600 dark:text-red-400">
                        <ChevronDownIcon className="inline-block size-3 mr-1"/>
                        {formatCurrency(bal.expenses)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Manage Wallets Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Wallets</DialogTitle>
            <DialogDescription>
              Add or remove wallets to track your balances separately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {WALLET_TYPE_ICON[w.type] ?? <WalletIcon className="size-4" />}
                  <span className="text-sm font-medium">{w.name}</span>
                </div>
                {hasTransactions(w.id) ? (
                  <Badge variant="outline" className="text-[10px]">In use</Badge>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon-sm">
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete wallet?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the "{w.name}" wallet. Wallets with transactions cannot be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => onRemoveWallet(w.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <PlusIcon className="size-4" />
              Add Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Wallet Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Wallet</DialogTitle>
            <DialogDescription>
              Create a new wallet to track a separate balance.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newType === "cash" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setNewType("cash")}
                >
                  <BanknoteIcon className="size-4" />
                  Cash
                </Button>
                <Button
                  type="button"
                  variant={newType === "e-wallet-card" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setNewType("e-wallet-card")}
                >
                  <WalletIcon className="size-4" />
                  E-Wallet / Card
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <Input
                type="text"
                placeholder={newType === "cash" ? "e.g. Petty Cash" : "e.g. GCash, Maya, BDO Credit Card"}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={30}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newName.trim()}>
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletCards;
