"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Transaction } from "@/types/transaction";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

// --- Chart 3: Daily Cash Flow Area Chart ---
export function DailyCashFlowChart({ transactions, color }: { transactions: Transaction[]; color: string }) {
    const areaChartConfig = useMemo(() => ({
        cumulative: { label: "Net Cash Flow", color },
    } satisfies ChartConfig), [color]);
    const data = useMemo(() => {
        const map = new Map<string, number>();
        for (const t of transactions) {
            const key = t.date;
            const prev = map.get(key) ?? 0;
            map.set(key, prev + (t.type === "income" ? t.amount : -t.amount));
        }
        const sorted = Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b));

        let cumulative = 0;
        return sorted.map(([date, daily]) => {
            cumulative += daily;
            return {
                date,
                daily,
                cumulative,
            };
        });
    }, [transactions]);

    if (data.length === 0) return null;

    return (
        <ChartContainer config={areaChartConfig} className="aspect-auto h-[300px] w-full">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                    <linearGradient id="fillCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-cumulative)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-cumulative)" stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => format(parseISO(v), "MMM d")}
                    minTickGap={30}
                />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompactCurrency(v)} width={56} />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            labelFormatter={(v: string) => format(parseISO(v), "MMM d, yyyy")}
                            formatter={(value, name) => (
                                <span>
                                    {areaChartConfig[name as keyof typeof areaChartConfig]?.label}: {formatCurrency(value as number)}
                                </span>
                            )}
                        />
                    }
                />
                <Area
                    dataKey="cumulative"
                    type="monotone"
                    fill="url(#fillCumulative)"
                    stroke="var(--color-cumulative)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ChartContainer>
    );
}
