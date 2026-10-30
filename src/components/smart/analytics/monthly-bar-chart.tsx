"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import type { Transaction } from "@/types/transaction";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

// --- Chart 1: Monthly Income vs Expense Bar Chart ---
export function MonthlyBarChart({ transactions, incomeColor, expenseColor }: { transactions: Transaction[]; incomeColor: string; expenseColor: string }) {
    const barChartConfig = useMemo(() => ({
        income: { label: "Income", color: incomeColor },
        expense: { label: "Expense", color: expenseColor },
    } satisfies ChartConfig), [incomeColor, expenseColor]);

    const data = useMemo(() => {
        const map = new Map<string, { month: string; income: number; expense: number }>();
        for (const t of transactions) {
            const key = format(parseISO(t.date), "yyyy-MM");
            if (!map.has(key)) map.set(key, { month: key, income: 0, expense: 0 });
            const entry = map.get(key)!;
            if (t.type === "income") entry.income += t.amount;
            else entry.expense += t.amount;
        }
        return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    }, [transactions]);

    if (data.length === 0) return null;

    return (
        <ChartContainer config={barChartConfig} className="aspect-auto h-[300px] w-full">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => format(parseISO(`${v}-01`), "MMM yyyy")}
                    minTickGap={16}
                />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompactCurrency(v)} width={56} />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            formatter={(value, name) => (
                                <span>
                                    {barChartConfig[name as keyof typeof barChartConfig]?.label}: {formatCurrency(value as number)}
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
    );
}
