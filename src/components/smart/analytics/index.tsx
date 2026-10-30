"use client";

import React, { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { BarChart3Icon } from "lucide-react";
import type { Transaction, Wallet } from "@/types/transaction";
import { isTransfer } from "@/types/transaction";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { CategoryPieChart } from "./category-pie-chart";
import { CategoryRanking } from "./category-ranking";
import { ANALYTICS_VIEWS, PERIOD_OPTIONS, PIE_COLOR_PALETTES, filterByPeriod } from "./config";
import { DailyCashFlowChart } from "./daily-cash-flow-chart";
import { MonthTracker } from "./month-tracker";
import { MonthlyBarChart } from "./monthly-bar-chart";
import { PaletteSelector } from "./palette-selector";
import { WalletComparisonChart } from "./wallet-comparison-chart";
import { WeekTracker } from "./week-tracker";
import { WeeklyBarChart } from "./weekly-bar-chart";

interface AnalyticsProps {
    transactions: Transaction[];
    wallets: Wallet[];
}

// --- Main Analytics Component ---
const Analytics: React.FC<AnalyticsProps> = ({ transactions, wallets }) => {
    const [period, setPeriod] = useState("6");
    const [analyticsTab, setAnalyticsTab] = useState("weekly");
    const [paletteKey, setPaletteKey] = useLocalStorage("analytics-palette", "default");

    const pieColors = PIE_COLOR_PALETTES[paletteKey]?.colors ?? PIE_COLOR_PALETTES.default.colors;

    const filtered = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);

    // Income/expense views exclude wallet-to-wallet transfers (they aren't real
    // income or spending). `filtered` (transfers included) is kept only for the
    // Wallet Balance Comparison, so balances still reflect the money that moved.
    const reportTx = useMemo(() => transactions.filter((t) => !isTransfer(t)), [transactions]);
    const reportFiltered = useMemo(() => filterByPeriod(reportTx, period), [reportTx, period]);

    if (transactions.length === 0) {
        return (
            <Empty className="border border-dashed mt-4">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <BarChart3Icon />
                    </EmptyMedia>
                    <EmptyTitle>No Transactions to Analyze</EmptyTitle>
                    <EmptyDescription>
                        Add some transactions first to see charts and insights about your spending and income.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-6 mt-4">
            {/* Period & Palette selectors */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <div className="flex w-full items-center gap-3 sm:w-auto">
                    <span className="w-14 shrink-0 text-sm text-muted-foreground sm:w-auto">Period:</span>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="flex-1 max-md:h-10 sm:w-[180px] sm:flex-none" size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PERIOD_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <PaletteSelector value={paletteKey} onChange={setPaletteKey} />
            </div>

            {/* Sub-tabs */}
            <Tabs value={analyticsTab} onValueChange={setAnalyticsTab}>
                <TabsList className="max-md:hidden">
                    {ANALYTICS_VIEWS.map((view) => (
                        <TabsTrigger key={view.value} value={view.value}>
                            {view.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                <Select value={analyticsTab} onValueChange={setAnalyticsTab}>
                    <SelectTrigger aria-label="Analytics view" className="h-10 md:hidden">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ANALYTICS_VIEWS.map((view) => (
                            <SelectItem key={view.value} value={view.value}>
                                {view.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* --- Weekly Tab --- */}
                <TabsContent value="weekly" className="flex flex-col gap-6">
                    <WeekTracker transactions={reportTx} pieColors={pieColors} />
                </TabsContent>

                {/* --- Monthly Tab --- */}
                <TabsContent value="monthly" className="flex flex-col gap-6">
                    <MonthTracker transactions={reportTx} pieColors={pieColors} />
                </TabsContent>

                {/* --- Overall Tab --- */}
                <TabsContent value="overall" className="flex flex-col gap-6">
                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Weekly Income vs Expense</h3>
                        <WeeklyBarChart transactions={reportFiltered} incomeColor={pieColors[0]} expenseColor={pieColors[1]} />
                    </section>

                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Monthly Income vs Expense</h3>
                        <MonthlyBarChart transactions={reportFiltered} incomeColor={pieColors[0]} expenseColor={pieColors[1]} />
                    </section>

                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Expense Category Breakdown</h3>
                        <CategoryPieChart transactions={reportFiltered} type="expense" pieColors={pieColors} />
                    </section>

                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Income Category Breakdown</h3>
                        <CategoryPieChart transactions={reportFiltered} type="income" pieColors={pieColors} />
                    </section>

                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Cumulative Cash Flow</h3>
                        <DailyCashFlowChart transactions={reportFiltered} color={pieColors[4 % pieColors.length]} />
                    </section>

                    {wallets.length >= 2 && (
                        <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                            <h3 className="text-sm font-semibold mb-3">Wallet Balance Comparison</h3>
                            <WalletComparisonChart wallets={wallets} transactions={filtered} color={pieColors[2 % pieColors.length]} />
                        </section>
                    )}
                </TabsContent>

                {/* --- Income Tab --- */}
                <TabsContent value="income" className="flex flex-col gap-6">
                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Income Category Breakdown</h3>
                        <CategoryPieChart transactions={reportFiltered} type="income" pieColors={pieColors} />
                    </section>

                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Income Ranking by Category</h3>
                        <CategoryRanking transactions={reportFiltered} type="income" pieColors={pieColors} />
                    </section>
                </TabsContent>

                {/* --- Expense Tab --- */}
                <TabsContent value="expense" className="flex flex-col gap-6">
                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Expense Category Breakdown</h3>
                        <CategoryPieChart transactions={reportFiltered} type="expense" pieColors={pieColors} />
                    </section>

                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Expense Ranking by Category</h3>
                        <CategoryRanking transactions={reportFiltered} type="expense" pieColors={pieColors} />
                    </section>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Analytics;
