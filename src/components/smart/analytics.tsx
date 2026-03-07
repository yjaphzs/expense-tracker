import React, { useMemo, useState } from "react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Pie,
    PieChart,
    Area,
    AreaChart,
    Cell,
    LabelList,
} from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@/components/ui/empty";
import { BarChart3Icon } from "lucide-react";
import type { Transaction, Wallet } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsProps {
    transactions: Transaction[];
    wallets: Wallet[];
}

const PERIOD_OPTIONS = [
    { value: "3", label: "Last 3 months" },
    { value: "6", label: "Last 6 months" },
    { value: "12", label: "Last 12 months" },
    { value: "all", label: "All time" },
];

const PIE_COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "oklch(0.65 0.15 160)",   // teal
    "oklch(0.65 0.20 30)",    // coral
    "oklch(0.70 0.15 270)",   // purple
];

function filterByPeriod(transactions: Transaction[], months: string) {
    if (months === "all") return transactions;
    const now = new Date();
    const start = startOfMonth(subMonths(now, parseInt(months)));
    const end = endOfMonth(now);
    return transactions.filter((t) => {
        const d = parseISO(t.date);
        return isWithinInterval(d, { start, end });
    });
}

// --- Chart 1: Monthly Income vs Expense Bar Chart ---
const barChartConfig = {
    income: { label: "Income", color: "oklch(0.72 0.17 155)" },
    expense: { label: "Expense", color: "oklch(0.63 0.21 25)" },
} satisfies ChartConfig;

function MonthlyBarChart({ transactions }: { transactions: Transaction[] }) {
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
                />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrency(v)} width={80} />
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

// --- Chart 2: Category Pie Chart ---
function CategoryPieChart({ transactions, type }: { transactions: Transaction[]; type: "expense" | "income" }) {
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
                color: PIE_COLORS[i % PIE_COLORS.length],
            };
        });
        return config;
    }, [data]);

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
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                        <LabelList
                            dataKey="amount"
                            className="fill-foreground"
                            stroke="none"
                            fontSize={10}
                            formatter={(v: number) => formatCurrency(v)}
                        />
                    </Pie>
                </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-2 justify-center">
                {data.map((d, i) => (
                    <Badge key={d.category} variant="outline" className="gap-1.5 text-xs">
                        <span
                            className="inline-block size-2.5 rounded-full"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        {d.category}: {formatCurrency(d.amount)} ({(d.amount / total * 100).toFixed(1)}%)
                    </Badge>
                ))}
            </div>
        </div>
    );
}

// --- Chart 3: Daily Cash Flow Area Chart ---
const areaChartConfig = {
    cumulative: { label: "Net Cash Flow", color: "var(--chart-5)" },
} satisfies ChartConfig;

function DailyCashFlowChart({ transactions }: { transactions: Transaction[] }) {
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
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrency(v)} width={80} />
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

// --- Chart 4: Wallet Balance Comparison ---
const walletChartConfig = {
    balance: { label: "Balance", color: "var(--chart-3)" },
} satisfies ChartConfig;

function WalletComparisonChart({ wallets, transactions }: { wallets: Wallet[]; transactions: Transaction[] }) {
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
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrency(v)} />
                <YAxis dataKey="wallet" type="category" tickLine={false} axisLine={false} width={100} />
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

// --- Main Analytics Component ---
const Analytics: React.FC<AnalyticsProps> = ({ transactions, wallets }) => {
    const [period, setPeriod] = useState("6");
    const [pieType, setPieType] = useState<"expense" | "income">("expense");

    const filtered = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);

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
            {/* Period selector */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px]" size="sm">
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

            {/* Chart 1: Monthly Income vs Expense */}
            <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                <h3 className="text-sm font-semibold mb-3">Monthly Income vs Expense</h3>
                <MonthlyBarChart transactions={filtered} />
            </section>

            {/* Chart 2: Category Breakdown */}
            <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Category Breakdown</h3>
                    <Select value={pieType} onValueChange={(v) => setPieType(v as "expense" | "income")}>
                        <SelectTrigger className="w-[130px]" size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="expense">Expenses</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <CategoryPieChart transactions={filtered} type={pieType} />
            </section>

            {/* Chart 3: Daily Cash Flow */}
            <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                <h3 className="text-sm font-semibold mb-3">Cumulative Cash Flow</h3>
                <DailyCashFlowChart transactions={filtered} />
            </section>

            {/* Chart 4: Wallet Comparison (only if 2+ wallets) */}
            {wallets.length >= 2 && (
                <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                    <h3 className="text-sm font-semibold mb-3">Wallet Balance Comparison</h3>
                    <WalletComparisonChart wallets={wallets} transactions={filtered} />
                </section>
            )}
        </div>
    );
};

export default Analytics;
