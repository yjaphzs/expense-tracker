"use client";

import { useMemo } from "react";
import type { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";
import { useCategoryIcon } from "@/context/tracker-context";

// --- Category Ranking ---
export function CategoryRanking({ transactions, type, pieColors }: { transactions: Transaction[]; type: "expense" | "income"; pieColors: string[] }) {
    const iconFor = useCategoryIcon();
    const data = useMemo(() => {
        const map = new Map<string, number>();
        for (const t of transactions.filter((t) => t.type === type)) {
            map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
        }
        return Array.from(map.entries())
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    }, [transactions, type]);

    if (data.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-4">
                No {type} transactions found.
            </p>
        );
    }

    const total = data.reduce((sum, d) => sum + d.amount, 0);

    return (
        <div className="flex flex-col gap-2">
            {data.map((d, i) => {
                const Icon = iconFor(d.category);
                const pct = (d.amount / total * 100).toFixed(1);
                return (
                    <div key={d.category} className="flex items-center gap-3 rounded-md border px-3 py-2">
                        <span className="text-sm font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                        <span
                            className="inline-block size-3 rounded-full shrink-0"
                            style={{ background: pieColors[i % pieColors.length] }}
                        />
                        <Icon className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium flex-1 truncate">{d.category}</span>
                        <span className="text-sm tabular-nums">{formatCurrency(d.amount)}</span>
                        <span className="text-xs text-muted-foreground w-12 text-right">{pct}%</span>
                    </div>
                );
            })}
        </div>
    );
}
