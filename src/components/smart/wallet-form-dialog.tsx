"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { BanknoteIcon, WalletIcon } from "lucide-react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { FormDialogActions } from "@/components/shared/form-dialog-actions";
import { Field } from "@/components/smart/form/field";
import { TypeToggle } from "@/components/smart/form/type-toggle";
import { Input } from "@/components/ui/input";
import { useTracker } from "@/context/tracker-context";
import type { WalletType } from "@/types/transaction";

/** Add a wallet, or change one's name and type. */
export default function WalletFormDialog() {
  const { dialogs, actions } = useTracker();
  const { open, editing } = dialogs.walletForm;
  const id = useId();
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("e-wallet-card");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setType(editing?.type ?? "e-wallet-card");
  }, [open, editing]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (editing) actions.editWallet(editing.id, { name, type });
    else actions.addWallet(name, type);
    dialogs.setWalletFormOpen(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={dialogs.setWalletFormOpen}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{editing ? "Edit Wallet" : "Add Wallet"}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {editing ? "Rename this wallet or change its type." : "Create a new wallet to track a separate balance."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form id={id} onSubmit={onSubmit} className="flex flex-col gap-4">
            <TypeToggle
              label="Type"
              value={type}
              onChange={setType}
              options={[
                { value: "cash", label: <><BanknoteIcon className="size-4" />Cash</> },
                { value: "e-wallet-card", label: <><WalletIcon className="size-4" />E-Wallet / Card</> },
              ]}
            />
            <Field id={`${id}-name`} label="Name">
              <Input
                id={`${id}-name`}
                placeholder={type === "cash" ? "e.g. Petty Cash" : "e.g. GCash, Maya, BDO Credit Card"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                required
              />
            </Field>
          </form>
        </ResponsiveDialogBody>
        <FormDialogActions formId={id} submitLabel={editing ? "Save Changes" : "Add"} disabled={!name.trim()} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
