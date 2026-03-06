import { useState, useEffect } from "react";
import AppHeader from "@/components/dom/app-header";
import ThemeSwitcher from "@/components/ui/theme-switcher";
import KofiButton from "@/components/dom/KofiButton";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
    PlusIcon,
    RotateCcwIcon,
    RepeatIcon,
    MoreHorizontalIcon,
    ImportIcon,
    DownloadIcon,
    SaveIcon,
    SaveAllIcon,
} from "lucide-react";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";

import { useLocalStorage } from "@/hooks/use-local-storage";
import BalanceSummary from "@/components/smart/balance-summary";
import AddTransactionDialog from "@/components/smart/add-transaction-dialog";
import AddRecurringDialog from "@/components/smart/add-recurring-dialog";
import TransactionList from "@/components/smart/transaction-list";
import RecurringList from "@/components/smart/recurring-list";
import {
    useTransactions,
} from "@/hooks/use-transactions";
import {
    useRecurringTransactions,
} from "@/hooks/use-recurring-transactions";
import type { Transaction, RecurringTransaction } from "@/types/transaction";

declare const __APP_VERSION__: string;

function App() {
    const appName = import.meta.env.VITE_APP_NAME || "My App";
    const appVersion = __APP_VERSION__;

    const TRANSACTIONS_STORAGE_KEY =
        import.meta.env.VITE_APP_LOCAL_STORAGE_TRANSACTIONS_KEY ||
        "expense_tracker_transactions";
    const RECURRING_STORAGE_KEY =
        import.meta.env.VITE_APP_LOCAL_STORAGE_RECURRING_KEY ||
        "expense_tracker_recurring";
    const AUTOSAVE_STORAGE_KEY =
        import.meta.env.VITE_APP_LOCAL_STORAGE_AUTOSAVE_KEY ||
        "expense_tracker_autosave";

    const [tab, setTab] = useState("home");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);

    const [autosave, setAutosave] = useLocalStorage<boolean>(
        AUTOSAVE_STORAGE_KEY,
        true,
        { enabled: true }
    );

    const {
        transactions,
        setTransactions,
        addTransaction,
        removeTransaction,
        clearTransactions,
        summary,
        getFilteredTransactions,
    } = useTransactions(TRANSACTIONS_STORAGE_KEY, autosave);

    const {
        recurringList,
        setRecurringList,
        addRecurring,
        removeRecurring,
        toggleRecurring,
        processDueTransactions,
    } = useRecurringTransactions(RECURRING_STORAGE_KEY, addTransaction, autosave);

    // Auto-process due recurring transactions on mount
    useEffect(() => {
        processDueTransactions();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSave = () => {
        try {
            localStorage.setItem(
                TRANSACTIONS_STORAGE_KEY,
                JSON.stringify(transactions)
            );
            localStorage.setItem(
                RECURRING_STORAGE_KEY,
                JSON.stringify(recurringList)
            );
        } catch {
            // silently fail
        }
    };

    const handleExport = () => {
        try {
            const exportData = {
                transactions: JSON.parse(
                    localStorage.getItem(TRANSACTIONS_STORAGE_KEY) ?? "[]"
                ),
                recurring: JSON.parse(
                    localStorage.getItem(RECURRING_STORAGE_KEY) ?? "[]"
                ),
                autosave: JSON.parse(
                    localStorage.getItem(AUTOSAVE_STORAGE_KEY) ?? "true"
                ),
            };

            const blob = new Blob(
                [JSON.stringify(exportData, null, 2)],
                { type: "application/json" }
            );
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "expense-tracker-export.json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch {
            // silently fail
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
                    !!t &&
                    typeof t === "object" &&
                    "id" in t &&
                    typeof (t as Transaction).id === "string" &&
                    "type" in t &&
                    "category" in t &&
                    "amount" in t &&
                    typeof (t as Transaction).amount === "number" &&
                    "date" in t;

                const isValidRecurring = (r: unknown): r is RecurringTransaction =>
                    !!r &&
                    typeof r === "object" &&
                    "id" in r &&
                    typeof (r as RecurringTransaction).id === "string" &&
                    "type" in r &&
                    "category" in r &&
                    "amount" in r &&
                    typeof (r as RecurringTransaction).amount === "number" &&
                    "frequency" in r &&
                    "startDate" in r;

                if (
                    !Array.isArray(data.transactions) ||
                    !data.transactions.every(isValidTransaction)
                ) {
                    throw new Error("Invalid transactions data.");
                }

                if (
                    data.recurring !== undefined &&
                    (!Array.isArray(data.recurring) ||
                        !data.recurring.every(isValidRecurring))
                ) {
                    throw new Error("Invalid recurring data.");
                }

                // Apply imported data
                setTransactions(data.transactions);
                localStorage.setItem(
                    TRANSACTIONS_STORAGE_KEY,
                    JSON.stringify(data.transactions)
                );

                if (Array.isArray(data.recurring)) {
                    setRecurringList(data.recurring);
                    localStorage.setItem(
                        RECURRING_STORAGE_KEY,
                        JSON.stringify(data.recurring)
                    );
                }

                if (typeof data.autosave === "boolean") {
                    setAutosave(data.autosave);
                    localStorage.setItem(
                        AUTOSAVE_STORAGE_KEY,
                        JSON.stringify(data.autosave)
                    );
                }
            } catch {
                // silently fail on invalid import
            }
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    };

    const onTabChange = (value: string) => {
        setTab(value);
    };

    const hasData = transactions.length > 0 || recurringList.length > 0;

    return (
        <div className="flex flex-col items-center justify-center min-h-svh p-4">
            <main className="flex-1 flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-3xl">
                    <div className="flex flex-row items-center justify-between w-full">
                        <AppHeader appName={appName} appVersion={appVersion} />
                        <ThemeSwitcher />
                    </div>
                    <Tabs value={tab} onValueChange={onTabChange}>
                        <TabsList className="mt-8">
                            <TabsTrigger value="home">Home</TabsTrigger>
                            <TabsTrigger value="income">Income</TabsTrigger>
                            <TabsTrigger value="expenses">Expenses</TabsTrigger>
                            <TabsTrigger value="recurring">
                                <RepeatIcon className="size-3.5" />
                                Recurring
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="home">
                            <BalanceSummary
                                balance={summary.balance}
                                income={summary.income}
                                expenses={summary.expenses}
                            />
                            <div className="flex flex-col gap-4 mt-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold">
                                        Recent Transactions
                                    </h2>
                                    <ButtonGroup>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDialogOpen(true)}
                                        >
                                            <PlusIcon className="size-4" />
                                            Add
                                        </Button>
                                        {hasData && (
                                            <AlertDialog
                                                open={resetDialogOpen}
                                                onOpenChange={setResetDialogOpen}
                                            >
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <RotateCcwIcon className="size-4" />
                                                        Reset
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <RotateCcwIcon className="size-10 border rounded-lg bg-primary text-primary-foreground p-2 mx-auto sm:mx-0" />
                                                        <AlertDialogTitle>
                                                            Reset all data?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently
                                                            delete all your transactions and recurring schedules.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => {
                                                                clearTransactions();
                                                                setResetDialogOpen(false);
                                                            }}
                                                            className="bg-destructive text-white hover:bg-destructive/90"
                                                        >
                                                            Reset
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon-sm"
                                                    aria-label="More Options"
                                                >
                                                    <MoreHorizontalIcon />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52">
                                                <DropdownMenuGroup>
                                                    <DropdownMenuItem onClick={handleImport}>
                                                        <ImportIcon />
                                                        Import
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={handleExport}>
                                                        <DownloadIcon />
                                                        Export
                                                    </DropdownMenuItem>
                                                </DropdownMenuGroup>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuGroup>
                                                    <DropdownMenuItem onClick={handleSave}>
                                                        <SaveIcon />
                                                        Save
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <SaveAllIcon />
                                                            Autosave
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            <DropdownMenuRadioGroup
                                                                value={autosave ? "enable" : "disabled"}
                                                                onValueChange={(value) =>
                                                                    setAutosave(value === "enable")
                                                                }
                                                            >
                                                                <DropdownMenuRadioItem value="enable">
                                                                    Enable
                                                                </DropdownMenuRadioItem>
                                                                <DropdownMenuRadioItem value="disabled">
                                                                    Disable
                                                                </DropdownMenuRadioItem>
                                                            </DropdownMenuRadioGroup>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </ButtonGroup>
                                </div>
                                <TransactionList
                                    transactions={transactions}
                                    onRemove={removeTransaction}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="income">
                            <div className="flex flex-col gap-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold">Income</h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDialogOpen(true)}
                                    >
                                        <PlusIcon className="size-4" />
                                        Add
                                    </Button>
                                </div>
                                <TransactionList
                                    transactions={getFilteredTransactions("income")}
                                    onRemove={removeTransaction}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="expenses">
                            <div className="flex flex-col gap-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold">Expenses</h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDialogOpen(true)}
                                    >
                                        <PlusIcon className="size-4" />
                                        Add
                                    </Button>
                                </div>
                                <TransactionList
                                    transactions={getFilteredTransactions("expense")}
                                    onRemove={removeTransaction}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="recurring">
                            <div className="flex flex-col gap-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold">Recurring Transactions</h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setRecurringDialogOpen(true)}
                                    >
                                        <PlusIcon className="size-4" />
                                        Add
                                    </Button>
                                </div>
                                <RecurringList
                                    items={recurringList}
                                    onRemove={removeRecurring}
                                    onToggle={toggleRecurring}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            <AddTransactionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onAdd={addTransaction}
            />

            <AddRecurringDialog
                open={recurringDialogOpen}
                onOpenChange={setRecurringDialogOpen}
                onAdd={addRecurring}
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
