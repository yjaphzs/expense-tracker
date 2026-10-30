"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Transaction, Wallet } from "@/types/transaction";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

// --- Chart 4: Wallet Balance Comparison ---
export function WalletComparisonChart({ wallets, transactions, color }: { wallets: Wallet[]; transactions: Transaction[]; color: string }) {
    const walletChartConfig = useMemo(() => ({
        balance: { label: "Balance", color },
    } satisfies ChartConfig), [color]);
    const data = useMemo(() => {
        const balances: Record<string, number> = {};
        for (const w of wallets) balances[w.id] = 0;
        for (const t of transactions) {
            if (!(t.walletId in balances)) continue;
            if (t.type === "income") balances[t.walletId] += t.amount;
            else balances[t.walletId] -= t.amount;
        }
        return wallets.map((w) => ({
            wallet: w.name,
            balance: balances[w.id] ?? 0,
        }));
    }, [wallets, transactions]);

    if (data.length < 2) return null;

    return (
        <ChartContainer config={walletChartConfig} className="aspect-auto h-[250px] w-full">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompactCurrency(v)} minTickGap={16} />
                <YAxis dataKey="wallet" type="category" tickLine={false} axisLine={false} width={88} />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            formatter={(value) => <span>{formatCurrency(value as number)}</span>}
                        />
                    }
                />
                <Bar dataKey="balance" fill="var(--color-balance)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ChartContainer>
    );
}
