"use client";

import { useMemo, useState } from "react";
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/transaction";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { CategoryPieChart } from "./category-pie-chart";
import { CategoryRanking } from "./category-ranking";

// --- Week Tracker: Detailed view for a single week ---
export function WeekTracker({ transactions, pieColors }: { transactions: Transaction[]; pieColors: string[] }) {
    const [weekOffset, setWeekOffset] = useState(0);

    const currentWeekDate = useMemo(() => subWeeks(new Date(), weekOffset), [weekOffset]);
    const weekStart = useMemo(() => startOfWeek(currentWeekDate, { weekStartsOn: 1 }), [currentWeekDate]);
    const weekEnd = useMemo(() => endOfWeek(currentWeekDate, { weekStartsOn: 1 }), [currentWeekDate]);

    const weekTransactions = useMemo(() => {
        return transactions.filter(t => {
            const d = parseISO(t.date);
            return isWithinInterval(d, { start: weekStart, end: weekEnd });
        });
    }, [transactions, weekStart, weekEnd]);

    const summary = useMemo(() => {
        let income = 0, expense = 0;
        for (const t of weekTransactions) {
            if (t.type === "income") income += t.amount;
            else expense += t.amount;
        }
        return {
            income,
            expense,
            net: income - expense,
            dailyAvgExpense: expense / 7,
        };
    }, [weekTransactions]);

    const dailyBreakdown = useMemo(() => {
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const config: ChartConfig = {
            income: { label: "Income", color: pieColors[0] },
            expense: { label: "Expense", color: pieColors[1] },
        };

        const data = days.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            let income = 0, expense = 0;
            for (const t of weekTransactions) {
                if (t.date === dayStr) {
                    if (t.type === "income") income += t.amount;
                    else expense += t.amount;
                }
            }
            return {
                day: format(day, "EEE"),
                fullDate: format(day, "MMM d"),
                income,
                expense,
            };
        });

        return { data, config };
    }, [weekTransactions, weekStart, weekEnd, pieColors]);

    return (
        <div className="flex flex-col gap-6">
            {/* Week Navigator */}
            <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="icon" className="size-8 max-md:size-10" aria-label="Previous week" onClick={() => setWeekOffset(o => o + 1)}>
                    <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-sm font-semibold text-center sm:min-w-[200px]">
                    {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
                </span>
                <Button variant="outline" size="icon" className="size-8 max-md:size-10" aria-label="Next week" onClick={() => setWeekOffset(o => Math.max(0, o - 1))} disabled={weekOffset === 0}>
                    <ChevronRightIcon className="size-4" />
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Income</p>
                    <p className="truncate text-base font-bold sm:text-lg text-green-600 dark:text-green-400">{formatCurrency(summary.income)}</p>
                </div>
                <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Expense</p>
                    <p className="truncate text-base font-bold sm:text-lg text-red-600 dark:text-red-400">{formatCurrency(summary.expense)}</p>
                </div>
                <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p className={`truncate text-base font-bold sm:text-lg ${summary.net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(summary.net)}</p>
                </div>
                <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Avg/Day</p>
                    <p className="truncate text-base font-bold sm:text-lg">{formatCurrency(summary.dailyAvgExpense)}</p>
                </div>
            </div>

            {/* Daily breakdown bar chart */}
            <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                <h3 className="text-sm font-semibold mb-3">Daily Breakdown</h3>
                <ChartContainer config={dailyBreakdown.config} className="aspect-auto h-[250px] w-full">
                    <BarChart data={dailyBreakdown.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompactCurrency(v)} width={56} />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(_v: string, payload: Array<{ payload?: { fullDate?: string } }>) => payload?.[0]?.payload?.fullDate ?? _v}
                                    formatter={(value, name) => (
                                        <span>
                                            {dailyBreakdown.config[name as string]?.label}: {formatCurrency(value as number)}
                                        </span>
                                    )}
                                />
                            }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </section>

            {/* Category breakdown for the week */}
            <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                <h3 className="text-sm font-semibold mb-3">Expense Categories This Week</h3>
                <CategoryPieChart transactions={weekTransactions} type="expense" pieColors={pieColors} />
            </section>

            <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                <h3 className="text-sm font-semibold mb-3">Expense Ranking This Week</h3>
                <CategoryRanking transactions={weekTransactions} type="expense" pieColors={pieColors} />
            </section>
        </div>
    );
}
