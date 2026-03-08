import { useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import AppHeader from "@/components/dom/app-header";
import ThemeSwitcher from "@/components/ui/theme-switcher";
import KofiButton from "@/components/dom/KofiButton";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";

import { PlusIcon, WalletIcon, RepeatIcon } from "lucide-react";
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
import type { Transaction, Wallet, RecurringTransaction } from "@/types/transaction";
import WalletCards from "@/components/smart/wallet-cards";
import RecurringList from "@/components/smart/recurring-list";
import DataToolbar from "@/components/smart/data-toolbar";
import Analytics from "@/components/smart/analytics";
import ExcelExport from "@/components/smart/excel-export";
import { useTransactions } from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";
import { useRecurringTransactions } from "@/hooks/use-recurring-transactions";
import { useLocalStorage } from "@/hooks/use-local-storage";

declare const __APP_VERSION__: string;

function App() {
    const appName = import.meta.env.VITE_APP_NAME || "My App";
    const appVersion = __APP_VERSION__;

    const transactionsKey = import.meta.env.VITE_APP_LOCAL_STORAGE_TRANSACTIONS_KEY || "expense_tracker_transactions";
    const recurringKey = import.meta.env.VITE_APP_LOCAL_STORAGE_RECURRING_KEY || "expense_tracker_recurring";
    const autosaveKey = import.meta.env.VITE_APP_LOCAL_STORAGE_AUTOSAVE_KEY || "expense_tracker_autosave";
    const walletsKey = "expense-tracker-wallets";

    const [autosave, setAutosave] = useLocalStorage<boolean>(autosaveKey, true, { enabled: true });

    const [tab, setTab] = useState("home");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<FormMode | undefined>(undefined);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [walletManageOpen, setWalletManageOpen] = useState(false);

    const {
        transactions,
        setTransactions,
        removeTransactions,
        addTransaction,
        removeTransaction,
        editTransaction,
        summary,
        getFilteredTransactions,
    } = useTransactions(transactionsKey, autosave);

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
        recurringList,
        setRecurringList,
        addRecurring,
        removeRecurring,
        toggleRecurring,
        clearRecurring,
        processDueTransactions,
    } = useRecurringTransactions(recurringKey, addTransaction, autosave);

    const processedRef = useRef(false);
    useEffect(() => {
        if (processedRef.current) return;
        processedRef.current = true;
        processDueTransactions();
    }, [processDueTransactions]);

    const {
        wallets,
        setWallets,
        removeWallets,
        addWallet,
        removeWallet,
        walletBalances,
    } = useWallets(transactions, walletsKey, autosave);

    const walletHasTransactions = (walletId: string) =>
        transactions.some((t) => t.walletId === walletId);

    const onTabChange = (value: string) => {
        setTab(value);
    };

    // --- Data management handlers ---

    const handleSave = () => {
        try {
            localStorage.setItem(transactionsKey, JSON.stringify(transactions));
            localStorage.setItem(recurringKey, JSON.stringify(recurringList));
            localStorage.setItem(walletsKey, JSON.stringify(wallets));
            toast.success("Data has been saved!");
        } catch {
            toast.error("Failed to save data.");
        }
    };

    const handleExport = () => {
        try {
            const exportData = {
                transactions: JSON.parse(localStorage.getItem(transactionsKey) ?? "[]"),
                recurring: JSON.parse(localStorage.getItem(recurringKey) ?? "[]"),
                wallets: JSON.parse(localStorage.getItem(walletsKey) ?? "[]"),
                autosave: JSON.parse(localStorage.getItem(autosaveKey) ?? "true"),
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
                const data = JSON.parse(text);

                if (!data || typeof data !== "object") {
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

                const isValidWallet = (w: unknown): w is Wallet =>
                    !!w && typeof w === "object" &&
                    typeof (w as Wallet).id === "string" &&
                    typeof (w as Wallet).name === "string" &&
                    typeof (w as Wallet).type === "string";

                const isValidRecurring = (r: unknown): r is RecurringTransaction =>
                    !!r && typeof r === "object" &&
                    typeof (r as RecurringTransaction).id === "string" &&
                    typeof (r as RecurringTransaction).type === "string" &&
                    typeof (r as RecurringTransaction).category === "string" &&
                    typeof (r as RecurringTransaction).amount === "number" &&
                    typeof (r as RecurringTransaction).frequency === "string";

                if (!Array.isArray(data.transactions) || !data.transactions.every(isValidTransaction)) {
                    throw new Error("Missing or invalid 'transactions' array.");
                }
                if (!Array.isArray(data.wallets) || !data.wallets.every(isValidWallet)) {
                    throw new Error("Missing or invalid 'wallets' array.");
                }
                if (!Array.isArray(data.recurring) || !data.recurring.every(isValidRecurring)) {
                    throw new Error("Missing or invalid 'recurring' array.");
                }
                if (typeof data.autosave !== "boolean") {
                    throw new Error("Missing or invalid 'autosave' value.");
                }

                setTransactions(data.transactions);
                localStorage.setItem(transactionsKey, JSON.stringify(data.transactions));

                setRecurringList(data.recurring);
                localStorage.setItem(recurringKey, JSON.stringify(data.recurring));

                setWallets(data.wallets);
                localStorage.setItem(walletsKey, JSON.stringify(data.wallets));

                setAutosave(data.autosave);
                localStorage.setItem(autosaveKey, JSON.stringify(data.autosave));

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
        removeTransactions();
        clearRecurring();
        removeWallets();
        setResetDialogOpen(false);
        toast.success("All data has been reset.");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-svh p-4">
            <Toaster richColors position="bottom-right" />
            <main className="flex-1 flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-3xl">
                    <div className="flex flex-row items-center justify-between w-full">
                        <AppHeader appName={appName} appVersion={appVersion} />
                        <ThemeSwitcher />
                    </div>
                    <Tabs value={tab} onValueChange={onTabChange}>
                        {wallets.length > 0 && (
                            <TabsList className="mt-8">
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
                            {wallets.length > 0 && (
                                <>
                                    <div className="flex items-center justify-between mt-6">
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
                                {wallets.length > 0 && recurringList.length > 0 && (
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
                            ) : recurringList.length === 0 ? (
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
                                    items={recurringList}
                                    onRemove={removeRecurring}
                                    onToggle={toggleRecurring}
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

            <footer className="w-full flex justify-center py-6 bg-transparent">
                <KofiButton
                    username="yjaphzs"
                    label="Buy Me a Ko-fi"
                    preset="no_background"
                />
            </footer>
        </div>
    );
}

export default App;
