"use client";

import { useMemo } from "react";
import { Pie, PieChart, Cell, LabelList } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/types/transaction";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";

// --- Chart 2: Category Pie Chart ---
export function CategoryPieChart({ transactions, type, pieColors }: { transactions: Transaction[]; type: "expense" | "income"; pieColors: string[] }) {
    const isMobile = useIsMobile();
    const data = useMemo(() => {
        const map = new Map<string, number>();
        for (const t of transactions.filter((t) => t.type === type)) {
            map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
        }
        return Array.from(map.entries())
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    }, [transactions, type]);

    const pieConfig = useMemo(() => {
        const config: ChartConfig = {};
        data.forEach((d, i) => {
            config[d.category] = {
                label: d.category,
                color: pieColors[i % pieColors.length],
            };
        });
        return config;
    }, [data, pieColors]);

    if (data.length === 0) return null;

    const total = data.reduce((sum, d) => sum + d.amount, 0);

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <ChartContainer config={pieConfig} className="aspect-square h-[250px] w-full max-w-[250px]">
                <PieChart>
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                formatter={(value, name) => (
                                    <span>
                                        {name}: {formatCurrency(value as number)} ({((value as number) / total * 100).toFixed(1)}%)
                                    </span>
                                )}
                            />
                        }
                    />
                    <Pie
                        data={data}
                        dataKey="amount"
                        nameKey="category"
                        innerRadius={55}
                        outerRadius={90}
                        strokeWidth={2}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                        {!isMobile && (
                            <LabelList
                                dataKey="amount"
                                className="fill-foreground"
                                stroke="none"
                                fontSize={10}
                                formatter={(v: number) => formatCompactCurrency(v)}
                            />
                        )}
                    </Pie>
                </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-2 justify-center">
                {data.map((d, i) => (
                    <Badge key={d.category} variant="outline" className="gap-1.5 text-xs">
                        <span
                            className="inline-block size-2.5 rounded-full"
                            style={{ background: pieColors[i % pieColors.length] }}
                        />
                        {d.category}: {formatCurrency(d.amount)} ({(d.amount / total * 100).toFixed(1)}%)
                    </Badge>
                ))}
            </div>
        </div>
    );
}
