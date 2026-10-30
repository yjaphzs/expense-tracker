"use client";

import { useMemo } from "react";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import type { Transaction } from "@/types/transaction";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

// --- Chart 5: Weekly Income vs Expense Bar Chart ---
export function WeeklyBarChart({ transactions, incomeColor, expenseColor }: { transactions: Transaction[]; incomeColor: string; expenseColor: string }) {
    const barChartConfig = useMemo(() => ({
        income: { label: "Income", color: incomeColor },
        expense: { label: "Expense", color: expenseColor },
    } satisfies ChartConfig), [incomeColor, expenseColor]);

    const data = useMemo(() => {
        const map = new Map<string, { week: string; income: number; expense: number }>();
        for (const t of transactions) {
            const d = parseISO(t.date);
            const weekStart = startOfWeek(d, { weekStartsOn: 1 });
            const key = format(weekStart, "yyyy-MM-dd");
            if (!map.has(key)) map.set(key, { week: key, income: 0, expense: 0 });
            const entry = map.get(key)!;
            if (t.type === "income") entry.income += t.amount;
            else entry.expense += t.amount;
        }
        return Array.from(map.values()).sort((a, b) => a.week.localeCompare(b.week));
    }, [transactions]);

    if (data.length === 0) return null;

    return (
        <ChartContainer config={barChartConfig} className="aspect-auto h-[300px] w-full">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => format(parseISO(v), "MMM d")}
                    minTickGap={16}
                />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompactCurrency(v)} width={56} />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            labelFormatter={(v: string) => {
                                const start = parseISO(v);
                                const end = endOfWeek(start, { weekStartsOn: 1 });
                                return `Week of ${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
                            }}
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
