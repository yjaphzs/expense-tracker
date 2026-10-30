"use client";

import { useState } from "react";
import { BanknoteIcon, CheckIcon, ImportIcon, PlusIcon, QrCodeIcon, WalletIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTracker } from "@/context/tracker-context";
import { markOnboarded } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import type { WalletType } from "@/types/transaction";

const SUGGESTED: { name: string; type: WalletType }[] = [
  { name: "Cash", type: "cash" },
  { name: "GCash", type: "e-wallet-card" },
  { name: "Maya", type: "e-wallet-card" },
  { name: "Bank card", type: "e-wallet-card" },
];

const STEPS = [
  ["Add your wallets", "Where your money is: cash, e-wallets, cards."],
  ["Record what you earn and spend", "Each entry updates the wallet's balance."],
  ["Set a budget (optional)", "See how the month is going at a glance."],
];

/**
 * First run: what the app does, and one tap to set up common wallets. The
 * picks replace the default Cash wallet (nothing uses it yet).
 */
export function OnboardingCard({ onDone }: { onDone: () => void }) {
  const { data, dialogs, actions } = useTracker();
  const [picked, setPicked] = useState<string[]>(["Cash"]);
  const toggle = (name: string) => setPicked((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  const addPicked = () => {
    const chosen = SUGGESTED.filter((s) => picked.includes(s.name));
    // Keep the default wallet's id for Cash so nothing else changes.
    data.setWallets(chosen.map((s) => ({ id: s.name === "Cash" ? "cash" : crypto.randomUUID(), name: s.name, type: s.type })));
    toast.success(chosen.length > 1 ? `${chosen.length} wallets added` : `Wallet "${chosen[0].name}" added`);
    finish();
  };

  const finish = () => {
    markOnboarded();
    onDone();
  };

  return (
    <section aria-labelledby="welcome-heading" className="mt-6 rounded-xl border bg-card p-5">
      <h2 id="welcome-heading" className="text-lg font-semibold">
        Welcome to Expense Tracker
      </h2>
      <ol className="mt-3 flex flex-col gap-2">
        {STEPS.map(([title, detail], index) => (
          <li key={title} className="flex gap-3 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-foreground">
              {index + 1}
            </span>
            <span>
              <span className="font-medium">{title}</span>
              <span className="block text-muted-foreground">{detail}</span>
            </span>
          </li>
        ))}
      </ol>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium">Pick your wallets</legend>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((wallet) => {
            const active = picked.includes(wallet.name);
            const Icon = active ? CheckIcon : wallet.type === "cash" ? BanknoteIcon : WalletIcon;
            return (
              <button
                key={wallet.name}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(wallet.name)}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                  active ? "border-primary bg-primary/15 font-medium" : "hover:bg-muted",
                )}
              >
                <Icon className="size-4" />
                {wallet.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => dialogs.openWalletForm()}
            className="flex h-10 items-center gap-2 rounded-full border border-dashed px-4 text-sm hover:bg-muted"
          >
            <PlusIcon className="size-4" />
            Other wallet…
          </button>
        </div>
      </fieldset>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button className="max-md:h-11" disabled={picked.length === 0} onClick={addPicked}>
          {picked.length > 1 ? `Add ${picked.length} wallets` : "Add wallet"}
        </Button>
        {data.wallets.length > 0 && (
          <Button variant="ghost" className="max-md:h-11" onClick={finish}>
            Just use Cash
          </Button>
        )}
        <Button variant="ghost" className="max-md:h-11" onClick={actions.importBackup}>
          <ImportIcon className="size-4" />
          Import a backup
        </Button>
        <Button variant="ghost" className="max-md:h-11" onClick={dialogs.openQr}>
          <QrCodeIcon className="size-4" />
          Receive by QR
        </Button>
      </div>
    </section>
  );
}
