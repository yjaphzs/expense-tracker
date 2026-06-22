"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import KofiButton from "@/components/dom/KofiButton";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";

import { PlusIcon, WalletIcon, RepeatIcon, ArrowLeftRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
} from "@/components/ui/empty";

import BalanceSummary from "@/components/smart/balance-summary";
import TransactionDialog, { type FormMode } from "@/components/smart/add-transaction-dialog";
import TransactionList from "@/components/smart/transaction-list";
import type { Transaction, RecurringTransaction, TrackerState } from "@/types";
import WalletCards from "@/components/smart/wallet-cards";
import RecurringList from "@/components/smart/recurring-list";
import AddRecurringDialog from "@/components/smart/add-recurring-dialog";
import TransferDialog from "@/components/smart/transfer-dialog";
import QrTransferDialog from "@/components/smart/qr-transfer-dialog";
import DataToolbar from "@/components/smart/data-toolbar";
import Analytics from "@/components/smart/analytics";
import ExcelExport from "@/components/smart/excel-export";
import { MergeDialog } from "@/components/smart/merge-dialog";
import { LoadingScreen } from "@/components/loading-screen";
import { useExpenseData } from "@/hooks/use-expense-data";
import { useTransactionLogic } from "@/hooks/use-transactions";
import { useWalletLogic } from "@/hooks/use-wallets";
import { useRecurringLogic } from "@/hooks/use-recurring-transactions";

export default function Home() {
    const data = useExpenseData();
    const {
        transactions,
        setTransactions,
        recurring,
        setRecurring,
        wallets,
        setWallets,
        autosave,
        setAutosave,
        replaceAll,
        persistNow,
        removeAll,
        loading,
        pendingMerge,
        resolveMerge,
    } = data;

    const [tab, setTab] = useState("home");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<FormMode | undefined>(undefined);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
    const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [qrTransferOpen, setQrTransferOpen] = useState(false);
    const [walletManageOpen, setWalletManageOpen] = useState(false);

    const {
        addTransaction,
        removeTransaction,
        editTransaction,
        summary,
        getFilteredTransactions,
    } = useTransactionLogic(transactions, setTransactions);

    const handleOpenAdd = (mode?: FormMode) => {
        setEditingTransaction(null);
        setDialogMode(mode);
        setDialogOpen(true);
    };

    const handleOpenEdit = (t: Transaction) => {
        setEditingTransaction(t);
        if (tab === "income") setDialogMode("income");
        else if (tab === "expenses") setDialogMode("expense");
        else setDialogMode(undefined);
        setDialogOpen(true);
    };

    const {
        addRecurring,
        removeRecurring,
        toggleRecurring,
        editRecurring,
        processDueTransactions,
    } = useRecurringLogic(recurring, setRecurring, addTransaction);

    // Process due recurring transactions once, after the data has loaded (so it
    // runs against the real list — guest localStorage or the first cloud snapshot —
    // rather than an empty initial state).
    const processedRef = useRef(false);
    useEffect(() => {
        if (loading) return;
        if (processedRef.current) return;
        processedRef.current = true;
        processDueTransactions();
    }, [loading, processDueTransactions]);

    const {
        addWallet,
        removeWallet,
        walletBalances,
    } = useWalletLogic(wallets, setWallets, transactions);

    const walletHasTransactions = (walletId: string) =>
        transactions.some((t) => t.walletId === walletId);

    const onTabChange = (value: string) => {
        setTab(value);
    };

    // --- Data management handlers ---

    const handleSave = () => {
        try {
            persistNow();
            toast.success("Data has been saved!");
        } catch {
            toast.error("Failed to save data.");
        }
    };

    const handleExport = () => {
        try {
            const exportData: TrackerState = {
                transactions,
                recurring,
                wallets,
                autosave,
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "expense-tracker-export.json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Exported data as expense-tracker-export.json!");
        } catch {
            toast.error("Failed to export data.");
        }
    };

    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.style.display = "none";

        input.onchange = async (event: Event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const parsed = JSON.parse(text);

                if (!parsed || typeof parsed !== "object") {
                    throw new Error("Invalid file structure.");
                }

                const isValidTransaction = (t: unknown): t is Transaction =>
                    !!t && typeof t === "object" &&
                    typeof (t as Transaction).id === "string" &&
                    typeof (t as Transaction).type === "string" &&
                    typeof (t as Transaction).category === "string" &&
                    typeof (t as Transaction).amount === "number" &&
                    typeof (t as Transaction).date === "string" &&
                    typeof (t as Transaction).walletId === "string";

                const isValidWallet = (w: unknown): boolean =>
                    !!w && typeof w === "object" &&
                    typeof (w as { id: unknown }).id === "string" &&
                    typeof (w as { name: unknown }).name === "string" &&
                    typeof (w as { type: unknown }).type === "string";

                const isValidRecurring = (r: unknown): r is RecurringTransaction =>
                    !!r && typeof r === "object" &&
                    typeof (r as RecurringTransaction).id === "string" &&
                    typeof (r as RecurringTransaction).type === "string" &&
                    typeof (r as RecurringTransaction).category === "string" &&
                    typeof (r as RecurringTransaction).amount === "number" &&
                    typeof (r as RecurringTransaction).frequency === "string";

                if (!Array.isArray(parsed.transactions) || !parsed.transactions.every(isValidTransaction)) {
                    throw new Error("Missing or invalid 'transactions' array.");
                }
                if (!Array.isArray(parsed.wallets) || !parsed.wallets.every(isValidWallet)) {
                    throw new Error("Missing or invalid 'wallets' array.");
                }
                if (!Array.isArray(parsed.recurring) || !parsed.recurring.every(isValidRecurring)) {
                    throw new Error("Missing or invalid 'recurring' array.");
                }
                if (typeof parsed.autosave !== "boolean") {
                    throw new Error("Missing or invalid 'autosave' value.");
                }

                replaceAll({
                    transactions: parsed.transactions,
                    recurring: parsed.recurring,
                    wallets: parsed.wallets,
                    autosave: parsed.autosave,
                });

                toast.success("Imported data successfully!");
            } catch {
                toast.error("Failed to import data. Invalid file format.");
            }
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    };

    const handleReset = () => {
        removeAll();
        setResetDialogOpen(false);
        toast.success("All data has been reset.");
    };

    if (loading) {
        return <LoadingScreen message="Loading your data…" />;
    }

    return (
        <div className="flex min-h-svh flex-col">
            <SiteHeader />
            <main className="w-full flex-1">
                <div className="mx-auto w-full max-w-3xl px-4 py-6">
                    <Tabs value={tab} onValueChange={onTabChange}>
                        {wallets.length > 0 && (
                            <TabsList className="mt-2">
                                <TabsTrigger value="home">Home</TabsTrigger>
                                <TabsTrigger value="income">Income</TabsTrigger>
                                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                                <TabsTrigger value="recurring">Recurring</TabsTrigger>
                                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            </TabsList>
                        )}
                        <TabsContent value="home">
                            <BalanceSummary
                                balance={summary.balance}
                                income={summary.income}
                                expenses={summary.expenses}
                            />
                            <WalletCards
                                wallets={wallets}
                                walletBalances={walletBalances}
                                onAddWallet={addWallet}
                                onRemoveWallet={removeWallet}
                                hasTransactions={walletHasTransactions}
                                manageOpen={walletManageOpen}
                                onManageOpenChange={setWalletManageOpen}
                                onImport={handleImport}
                            />
                            {wallets.length >= 2 && (
                                <div className="mt-4">
                                    <Button variant="outline" size="sm" onClick={() => setTransferDialogOpen(true)}>
                                        <ArrowLeftRightIcon className="size-4" /> Transfer Between Wallets
                                    </Button>
                                </div>
                            )}
                            {wallets.length > 0 && (
                                <>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 gap-4">
                                        <h2 className="text-lg font-semibold">Recent Transactions</h2>
                                        {transactions.length > 0 && (
                                            <DataToolbar
                                                onAdd={() => handleOpenAdd()}
                                                addLabel="Add Transaction"
                                                handleSave={handleSave}
                                                autosave={autosave}
                                                setAutosave={setAutosave}
                                                resetDialogOpen={resetDialogOpen}
                                                setResetDialogOpen={setResetDialogOpen}
                                                handleReset={handleReset}
                                                handleImport={handleImport}
                                                handleExport={handleExport}
                                                onQrTransfer={() => setQrTransferOpen(true)}
                                                hasWallets
                                                hasItems
                                                onManageWallets={() => setWalletManageOpen(true)}
                                            />
                                        )}
                                    </div>
                                    {transactions.length === 0 ? (
                                        <DataToolbar
                                            onAdd={() => handleOpenAdd()}
                                            addLabel="Add Transaction"
                                            handleSave={handleSave}
                                            autosave={autosave}
                                            setAutosave={setAutosave}
                                            resetDialogOpen={resetDialogOpen}
                                            setResetDialogOpen={setResetDialogOpen}
                                            handleReset={handleReset}
                                            handleImport={handleImport}
                                            handleExport={handleExport}
                                            onQrTransfer={() => setQrTransferOpen(true)}
                                            hasWallets
                                            hasItems={false}
                                            onManageWallets={() => setWalletManageOpen(true)}
                                        />
                                    ) : (
                                        <TransactionList
                                            transactions={transactions}
                                            wallets={wallets}
                                            onRemove={removeTransaction}
                                            onEdit={handleOpenEdit}
                                        />
                                    )}
                                </>
                            )}
                        </TabsContent>
                        <TabsContent value="income">
                            <div className="flex items-center justify-between mt-4">
                                <h2 className="text-lg font-semibold">Income</h2>
                                {wallets.length > 0 && getFilteredTransactions("income").length > 0 && (
                                    <Button variant="outline" size="sm" onClick={() => handleOpenAdd("income")}>
                                        <PlusIcon className="size-4" />
                                        Add Income
                                    </Button>
                                )}
                            </div>
                            {wallets.length === 0 ? (
                                <Empty className="border border-dashed mt-4">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon"><WalletIcon /></EmptyMedia>
                                        <EmptyTitle>No Wallets Found</EmptyTitle>
                                        <EmptyDescription>You need to add a wallet before you can start tracking transactions.</EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        <Button variant="outline" size="sm" onClick={() => setWalletManageOpen(true)}>
                                            <PlusIcon className="size-4" /> Add Wallet
                                        </Button>
                                    </EmptyContent>
                                </Empty>
                            ) : getFilteredTransactions("income").length === 0 ? (
                                <Empty className="border border-dashed mt-4">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon"><WalletIcon /></EmptyMedia>
                                        <EmptyTitle>No income yet</EmptyTitle>
                                        <EmptyDescription>Add your first income transaction to start tracking your earnings.</EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        <Button variant="outline" size="sm" onClick={() => handleOpenAdd("income")}>
                                            <PlusIcon className="size-4" /> Add Income
                                        </Button>
                                    </EmptyContent>
                                </Empty>
                            ) : (
                                <TransactionList
                                    transactions={getFilteredTransactions("income")}
                                    wallets={wallets}
                                    onRemove={removeTransaction}
                                    onEdit={handleOpenEdit}
                                />
                            )}
                        </TabsContent>
                        <TabsContent value="expenses">
                            <div className="flex items-center justify-between mt-4">
                                <h2 className="text-lg font-semibold">Expenses</h2>
                                {wallets.length > 0 && getFilteredTransactions("expense").length > 0 && (
                                    <Button variant="outline" size="sm" onClick={() => handleOpenAdd("expense")}>
                                        <PlusIcon className="size-4" />
                                        Add Expense
                                    </Button>
                                )}
                            </div>
                            {wallets.length === 0 ? (
                                <Empty className="border border-dashed mt-4">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon"><WalletIcon /></EmptyMedia>
                                        <EmptyTitle>No Wallets Found</EmptyTitle>
                                        <EmptyDescription>You need to add a wallet before you can start tracking transactions.</EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        <Button variant="outline" size="sm" onClick={() => setWalletManageOpen(true)}>
                                            <PlusIcon className="size-4" /> Add Wallet
                                        </Button>
                                    </EmptyContent>
                                </Empty>
                            ) : getFilteredTransactions("expense").length === 0 ? (
                                <Empty className="border border-dashed mt-4">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon"><WalletIcon /></EmptyMedia>
                                        <EmptyTitle>No expenses yet</EmptyTitle>
                                        <EmptyDescription>Add your first expense to start tracking your spending.</EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        <Button variant="outline" size="sm" onClick={() => handleOpenAdd("expense")}>
                                            <PlusIcon className="size-4" /> Add Expense
                                        </Button>
                                    </EmptyContent>
                                </Empty>
                            ) : (
                                <TransactionList
                                    transactions={getFilteredTransactions("expense")}
                                    wallets={wallets}
                                    onRemove={removeTransaction}
                                    onEdit={handleOpenEdit}
                                />
                            )}
                        </TabsContent>
                        <TabsContent value="recurring">
                            <div className="flex items-center justify-between mt-4">
                                <h2 className="text-lg font-semibold">Recurring</h2>
                                {wallets.length > 0 && recurring.length > 0 && (
                                    <Button variant="outline" size="sm" onClick={() => handleOpenAdd("recurring")}>
                                        <PlusIcon className="size-4" />
                                        Add Recurring
                                    </Button>
                                )}
                            </div>
                            {wallets.length === 0 ? (
                                <Empty className="border border-dashed mt-4">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon"><WalletIcon /></EmptyMedia>
                                        <EmptyTitle>No Wallets Found</EmptyTitle>
                                        <EmptyDescription>You need to add a wallet before you can set up recurring transactions.</EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        <Button variant="outline" size="sm" onClick={() => setWalletManageOpen(true)}>
                                            <PlusIcon className="size-4" /> Add Wallet
                                        </Button>
                                    </EmptyContent>
                                </Empty>
                            ) : recurring.length === 0 ? (
                                <Empty className="border border-dashed mt-4">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon"><RepeatIcon /></EmptyMedia>
                                        <EmptyTitle>No recurring transactions</EmptyTitle>
                                        <EmptyDescription>Set up automatic income or expenses that repeat on a schedule.</EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        <Button variant="outline" size="sm" onClick={() => handleOpenAdd("recurring")}>
                                            <PlusIcon className="size-4" /> Add Recurring
                                        </Button>
                                    </EmptyContent>
                                </Empty>
                            ) : (
                                <RecurringList
                                    items={recurring}
                                    onRemove={removeRecurring}
                                    onToggle={toggleRecurring}
                                    onEdit={(r) => {
                                        setEditingRecurring(r);
                                        setRecurringDialogOpen(true);
                                    }}
                                />
                            )}
                        </TabsContent>
                        <TabsContent value="analytics">
                            <div className="flex items-center justify-between mt-4">
                                <h2 className="text-lg font-semibold">Analytics</h2>
                            </div>
                            <Analytics transactions={transactions} wallets={wallets} />
                            <div className="mt-6">
                                <ExcelExport transactions={transactions} wallets={wallets} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            {tab !== "home" && (
                <WalletCards
                    wallets={wallets}
                    walletBalances={walletBalances}
                    onAddWallet={addWallet}
                    onRemoveWallet={removeWallet}
                    hasTransactions={walletHasTransactions}
                    manageOpen={walletManageOpen}
                    onManageOpenChange={setWalletManageOpen}
                    dialogsOnly
                />
            )}

            <TransactionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onAdd={addTransaction}
                onEdit={editTransaction}
                onAddRecurring={addRecurring}
                wallets={wallets}
                editingTransaction={editingTransaction}
                lockedType={dialogMode}
            />

            <AddRecurringDialog
                open={recurringDialogOpen}
                onOpenChange={(open) => {
                    setRecurringDialogOpen(open);
                    if (!open) setEditingRecurring(null);
                }}
                onAdd={addRecurring}
                onEdit={editRecurring}
                wallets={wallets}
                editingRecurring={editingRecurring}
            />

            <TransferDialog
                open={transferDialogOpen}
                onOpenChange={setTransferDialogOpen}
                wallets={wallets}
                onTransfer={(fromTx, toTx) => {
                    addTransaction(fromTx);
                    addTransaction(toTx);
                }}
            />

            <QrTransferDialog
                open={qrTransferOpen}
                onOpenChange={setQrTransferOpen}
                transactions={transactions}
                wallets={wallets}
                recurring={recurring}
                autosave={autosave}
                onImport={(imported) => {
                    replaceAll({
                        transactions: imported.transactions,
                        recurring: imported.recurring,
                        wallets: imported.wallets,
                        // Coerce: a QR payload without an autosave flag must not
                        // write `undefined` (Firestore rejects it) — keep the
                        // current setting instead.
                        autosave:
                            typeof imported.autosave === "boolean"
                                ? imported.autosave
                                : autosave,
                    });
                    toast.success("Data imported via QR transfer!");
                }}
            />

            <MergeDialog conflict={pendingMerge} onResolve={resolveMerge} />

            <footer className="mt-12 border-t">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-4">
                    <KofiButton
                        username="yjaphzs"
                        label="Buy Me a Ko-fi"
                        preset="no_background"
                    />
                    <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <Link href="/terms-and-conditions" className="transition-colors hover:text-primary">
                            Terms and Conditions
                        </Link>
                        <span aria-hidden className="text-border">
                            •
                        </span>
                        <Link href="/privacy-policy" className="transition-colors hover:text-primary">
                            Privacy Policy
                        </Link>
                    </nav>
                    <p className="text-xs text-muted-foreground">
                        © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
                        Expense Tracker · Made by{" "}
                        <a
                            href="https://www.yjaphzs.xyz/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium transition-colors hover:text-primary"
                        >
                            JPB
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
