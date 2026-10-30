"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
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

import {
    PlusIcon,
    WalletIcon,
    RepeatIcon,
    ArrowLeftRightIcon,
    HomeIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    ChartPieIcon,
} from "lucide-react";
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
import type { Transaction, RecurringTransaction, TrackerState, WalletType } from "@/types";
import WalletCards from "@/components/smart/wallet-cards";
import RecurringList from "@/components/smart/recurring-list";
import AddRecurringDialog from "@/components/smart/add-recurring-dialog";
import TransferDialog from "@/components/smart/transfer-dialog";
import DataToolbar from "@/components/smart/data-toolbar";
import { MergeDialog } from "@/components/smart/merge-dialog";
import { TrackerSkeleton } from "@/components/smart/tracker-skeleton";
import { useExpenseData } from "@/hooks/use-expense-data";
import { useTransactionLogic } from "@/hooks/use-transactions";
import { useWalletLogic } from "@/hooks/use-wallets";
import { useRecurringLogic } from "@/hooks/use-recurring-transactions";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomTabBar, type BottomTab } from "@/components/shared/bottom-tab-bar";
import { FloatingAddButton } from "@/components/shared/floating-add-button";
import { useUrlTab } from "@/hooks/use-url-tab";
import { cn, formatCurrency } from "@/lib/utils";
import { isTransfer } from "@/types/transaction";

/** Placeholder while the Analytics tab's code loads (first visit only). */
function AnalyticsLoading() {
    return (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading analytics">
            <Skeleton className="h-9 w-full max-w-sm" />
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[250px] w-full" />
        </div>
    );
}

// The Analytics tab (charts) and Excel export are the heaviest parts of the
// app, so they load the first time that tab is opened, not with the page.
const Analytics = dynamic(() => import("@/components/smart/analytics"), {
    ssr: false,
    loading: () => <AnalyticsLoading />,
});
const ExcelExport = dynamic(() => import("@/components/smart/excel-export"), { ssr: false });
// QR codes and the camera scanner: only downloaded once QR Transfer is opened.
const QrTransferDialog = dynamic(() => import("@/components/smart/qr-transfer-dialog"), { ssr: false });

type Section = "home" | "income" | "expenses" | "recurring" | "analytics";

const SECTIONS: BottomTab<Section>[] = [
    { value: "home", label: "Home", icon: HomeIcon },
    { value: "income", label: "Income", icon: TrendingUpIcon },
    { value: "expenses", label: "Expenses", icon: TrendingDownIcon },
    { value: "recurring", label: "Recurring", icon: RepeatIcon },
    { value: "analytics", label: "Analytics", icon: ChartPieIcon },
];
const SECTION_VALUES = SECTIONS.map((section) => section.value);

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

    const [tab, setTab] = useUrlTab<Section>(SECTION_VALUES, "home");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<FormMode | undefined>(undefined);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
    const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [qrTransferOpen, setQrTransferOpen] = useState(false);
    const [qrTransferUsed, setQrTransferUsed] = useState(false);
    const openQrTransfer = () => {
        setQrTransferUsed(true);
        setQrTransferOpen(true);
    };
    const [walletManageOpen, setWalletManageOpen] = useState(false);

    const {
        addTransaction,
        removeTransaction,
        restoreTransactions,
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

    const handleAddWallet = (name: string, type: WalletType) => {
        addWallet(name, type);
        toast.success(`Wallet "${name}" added`);
    };

    const handleRemoveWallet = (id: string) => {
        removeWallet(id);
        toast.success("Wallet deleted");
    };

    const walletHasTransactions = (walletId: string) =>
        transactions.some((t) => t.walletId === walletId);

    const onTabChange = (value: string) => {
        setTab(value as Section);
    };

    // Deletes right away and offers Undo (a transfer goes with its other leg),
    // instead of a confirmation dialog on every row.
    const handleDelete = (t: Transaction) => {
        const removed = removeTransaction(t.id);
        if (removed.length === 0) return;
        const what = isTransfer(t) ? "Transfer" : t.type === "income" ? "Income" : "Expense";
        toast(`${what} deleted`, {
            description: `${t.description || t.category} · ${formatCurrency(t.amount)}`,
            action: { label: "Undo", onClick: () => restoreTransactions(removed) },
        });
    };

    // Phones: the floating Add button does what the current section's Add does.
    const floatingAdd: { label: string; onClick: () => void } | null =
        tab === "home"
            ? { label: "Add", onClick: () => handleOpenAdd() }
            : tab === "income"
              ? { label: "Add income", onClick: () => handleOpenAdd("income") }
              : tab === "expenses"
                ? { label: "Add expense", onClick: () => handleOpenAdd("expense") }
                : tab === "recurring"
                  ? { label: "Add recurring", onClick: () => handleOpenAdd("recurring") }
                  : null;
    const showPhoneNav = !loading && wallets.length > 0;

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

    return (
        <div
            className={cn(
                "flex min-h-svh flex-col",
                // Clear the fixed bottom tab bar on phones.
                showPhoneNav && "max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom))]",
            )}
        >
            <SiteHeader />
            <main className="w-full flex-1">
                <div className={cn("mx-auto w-full max-w-3xl px-4 py-6", showPhoneNav && "max-md:pb-24")}>
                    {loading ? (
                    <TrackerSkeleton />
                    ) : (
                    <Tabs value={tab} onValueChange={onTabChange}>
                        {wallets.length > 0 && (
                            <TabsList className="mt-2 max-md:hidden">
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
                                onAddWallet={handleAddWallet}
                                onRemoveWallet={handleRemoveWallet}
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
                                    <div className="flex items-center justify-between mt-6 gap-4">
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
                                                onQrTransfer={openQrTransfer}
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
                                            onQrTransfer={openQrTransfer}
                                            hasWallets
                                            hasItems={false}
                                            onManageWallets={() => setWalletManageOpen(true)}
                                        />
                                    ) : (
                                        <TransactionList
                                            transactions={transactions}
                                            wallets={wallets}
                                            onRemove={handleDelete}
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
                                    <Button variant="outline" size="sm" className="max-md:hidden" onClick={() => handleOpenAdd("income")}>
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
                                    onRemove={handleDelete}
                                    onEdit={handleOpenEdit}
                                />
                            )}
                        </TabsContent>
                        <TabsContent value="expenses">
                            <div className="flex items-center justify-between mt-4">
                                <h2 className="text-lg font-semibold">Expenses</h2>
                                {wallets.length > 0 && getFilteredTransactions("expense").length > 0 && (
                                    <Button variant="outline" size="sm" className="max-md:hidden" onClick={() => handleOpenAdd("expense")}>
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
                                    onRemove={handleDelete}
                                    onEdit={handleOpenEdit}
                                />
                            )}
                        </TabsContent>
                        <TabsContent value="recurring">
                            <div className="flex items-center justify-between mt-4">
                                <h2 className="text-lg font-semibold">Recurring</h2>
                                {wallets.length > 0 && recurring.length > 0 && (
                                    <Button variant="outline" size="sm" className="max-md:hidden" onClick={() => handleOpenAdd("recurring")}>
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
                                    onRemove={(id) => {
                                        removeRecurring(id);
                                        toast.success("Recurring transaction deleted");
                                    }}
                                    onToggle={(id) => {
                                        const item = recurring.find((r) => r.id === id);
                                        toggleRecurring(id);
                                        if (item) toast.success(item.enabled ? "Recurring transaction paused" : "Recurring transaction resumed");
                                    }}
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
                    )}
                </div>
            </main>

            {tab !== "home" && (
                <WalletCards
                    wallets={wallets}
                    walletBalances={walletBalances}
                    onAddWallet={handleAddWallet}
                    onRemoveWallet={handleRemoveWallet}
                    hasTransactions={walletHasTransactions}
                    manageOpen={walletManageOpen}
                    onManageOpenChange={setWalletManageOpen}
                    dialogsOnly
                />
            )}

            <TransactionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onAdd={(data) => {
                    addTransaction(data);
                    toast.success(data.type === "income" ? "Income added" : "Expense added");
                }}
                onEdit={(id, data) => {
                    editTransaction(id, data);
                    toast.success("Transaction updated");
                }}
                onAddRecurring={(data) => {
                    addRecurring(data);
                    toast.success("Recurring transaction added");
                }}
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
                onAdd={(data) => {
                    addRecurring(data);
                    toast.success("Recurring transaction added");
                }}
                onEdit={(id, data) => {
                    editRecurring(id, data);
                    toast.success("Recurring transaction updated");
                }}
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
                    toast.success("Transfer added");
                }}
            />

            {qrTransferUsed && (
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
            )}

            <MergeDialog conflict={pendingMerge} onResolve={resolveMerge} />

            {showPhoneNav && (
                <>
                    <BottomTabBar tabs={SECTIONS} value={tab} onChange={setTab} />
                    {floatingAdd && <FloatingAddButton label={floatingAdd.label} onClick={floatingAdd.onClick} />}
                </>
            )}

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
