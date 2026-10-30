"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { ResponsiveMenu } from "@/components/shared/responsive-menu";
import type { MenuGroup } from "@/components/shared/menu-types";
import { WALLET_TYPE_ICON } from "@/components/smart/wallet-cards";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTracker } from "@/context/tracker-context";
import type { Wallet } from "@/types/transaction";

/** The wallet list: edit, reorder (the order cards and pickers use), and delete unused wallets. */
export default function ManageWalletsDialog() {
  const { data, dialogs, actions } = useTracker();
  const { wallets } = data;
  const [deleting, setDeleting] = useState<Wallet | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inUse = (id: string) => data.transactions.some((t) => t.walletId === id);

  const menu = (wallet: Wallet, index: number): MenuGroup[] => [
    {
      id: "wallet",
      items: [
        { kind: "action", id: "edit", label: "Edit", icon: PencilIcon, onSelect: () => dialogs.openWalletForm(wallet) },
        ...(index > 0
          ? [{ kind: "action" as const, id: "up", label: "Move up", icon: ArrowUpIcon, onSelect: () => data.moveWallet(wallet.id, -1) }]
          : []),
        ...(index < wallets.length - 1
          ? [{ kind: "action" as const, id: "down", label: "Move down", icon: ArrowDownIcon, onSelect: () => data.moveWallet(wallet.id, 1) }]
          : []),
        ...(inUse(wallet.id)
          ? []
          : [
              {
                kind: "action" as const,
                id: "delete",
                label: "Delete",
                icon: Trash2Icon,
                destructive: true,
                onSelect: () => {
                  setDeleting(wallet);
                  setConfirmOpen(true);
                },
              },
            ]),
      ],
    },
  ];

  return (
    <>
      <ResponsiveDialog open={dialogs.walletsOpen} onOpenChange={dialogs.setWalletsOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Manage Wallets</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Edit, reorder, or remove wallets. Wallets with transactions can&apos;t be deleted.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="flex flex-col gap-2 md:max-h-72 md:overflow-y-auto">
            {wallets.map((wallet, index) => {
              const Icon = WALLET_TYPE_ICON[wallet.type];
              return (
                <div key={wallet.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate text-sm font-medium">{wallet.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {inUse(wallet.id) && (
                      <Badge variant="outline" className="text-xs md:text-[10px]">
                        In use
                      </Badge>
                    )}
                    <ResponsiveMenu
                      title={wallet.name}
                      groups={menu(wallet, index)}
                      trigger={
                        <Button variant="ghost" size="icon-sm" className="max-md:size-10" aria-label={`Options for ${wallet.name}`}>
                          <MoreHorizontalIcon />
                        </Button>
                      }
                    />
                  </div>
                </div>
              );
            })}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button variant="outline" className="max-md:h-11" onClick={() => dialogs.openWalletForm()}>
              <PlusIcon className="size-4" />
              Add Wallet
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete wallet?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the &quot;{deleting?.name}&quot; wallet.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleting && actions.removeWallet(deleting.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
