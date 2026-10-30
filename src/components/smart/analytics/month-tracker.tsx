"use client";

import { useMemo, useState } from "react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval, endOfWeek, eachWeekOfInterval } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/transaction";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { CategoryPieChart } from "./category-pie-chart";
import { CategoryRanking } from "./category-ranking";

// --- Month Tracker: Detailed view for a single month ---
export function MonthTracker({ transactions, pieColors }: { transactions: Transaction[]; pieColors: string[] }) {
    const [monthOffset, setMonthOffset] = useState(0);

    const currentMonth = useMemo(() => subMonths(new Date(), monthOffset), [monthOffset]);

    const monthTransactions = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return transactions.filter(t => {
            const d = parseISO(t.date);
            return isWithinInterval(d, { start, end });
        });
    }, [transactions, currentMonth]);

    const summary = useMemo(() => {
        let income = 0, expense = 0;
        for (const t of monthTransactions) {
            if (t.type === "income") income += t.amount;
            else expense += t.amount;
        }
        const daysInMonth = endOfMonth(currentMonth).getDate();
        const daysPassed = monthOffset === 0
            ? Math.min(new Date().getDate(), daysInMonth)
            : daysInMonth;
        return {
            income,
            expense,
            net: income - expense,
            dailyAvgExpense: daysPassed > 0 ? expense / daysPassed : 0,
            weeklyAvgExpense: daysPassed > 0 ? (expense / daysPassed) * 7 : 0,
        };
    }, [monthTransactions, currentMonth, monthOffset]);

    const weeklyBreakdown = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });

        const barChartConfig: ChartConfig = {
            income: { label: "Income", color: pieColors[0] },
            expense: { label: "Expense", color: pieColors[1] },
        };

        const data = weeks.map(weekStart => {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const effectiveStart = weekStart < start ? start : weekStart;
            const effectiveEnd = weekEnd > end ? end : weekEnd;

            let income = 0, expense = 0;
            for (const t of monthTransactions) {
                const d = parseISO(t.date);
                if (isWithinInterval(d, { start: effectiveStart, end: effectiveEnd })) {
                    if (t.type === "income") income += t.amount;
                    else expense += t.amount;
                }
            }

            return {
                week: `${format(effectiveStart, "MMM d")} – ${format(effectiveEnd, "d")}`,
                income,
                expense,
            };
        });

        return { data, config: barChartConfig };
    }, [monthTransactions, currentMonth, pieColors]);

    return (
        <div className="flex flex-col gap-6">
            {/* Month Navigator */}
            <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="icon" className="size-8 max-md:size-10" aria-label="Previous month" onClick={() => setMonthOffset(o => o + 1)}>
                    <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-sm font-semibold min-w-[140px] text-center">
                    {format(currentMonth, "MMMM yyyy")}
                </span>
                <Button variant="outline" size="icon" className="size-8 max-md:size-10" aria-label="Next month" onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0}>
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
                    <p className="text-xs text-muted-foreground">Avg/Week</p>
                    <p className="truncate text-base font-bold sm:text-lg">{formatCurrency(summary.weeklyAvgExpense)}</p>
                </div>
            </div>

            {/* Weekly breakdown bar chart within the month */}
            {weeklyBreakdown.data.length > 0 && (
                <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                    <h3 className="text-sm font-semibold mb-3">Weekly Breakdown</h3>
                    <ChartContainer config={weeklyBreakdown.config} className="aspect-auto h-[250px] w-full">
                        <BarChart data={weeklyBreakdown.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={11} minTickGap={8} />
                            <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompactCurrency(v)} width={56} />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        formatter={(value, name) => (
                                            <span>
                                                {weeklyBreakdown.config[name as string]?.label}: {formatCurrency(value as number)}
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
            )}

            {/* Category breakdown for the month */}
            <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                <h3 className="text-sm font-semibold mb-3">Expense Categories This Month</h3>
                <CategoryPieChart transactions={monthTransactions} type="expense" pieColors={pieColors} />
            </section>

            <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                <h3 className="text-sm font-semibold mb-3">Expense Ranking This Month</h3>
                <CategoryRanking transactions={monthTransactions} type="expense" pieColors={pieColors} />
            </section>
        </div>
    );
}
