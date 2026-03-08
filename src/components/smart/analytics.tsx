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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { getCategoryIcon } from "@/lib/category-icons";

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

const PIE_COLOR_PALETTES: Record<string, { label: string; colors: string[] }> = {
    default: {
        label: "Default",
        colors: [
            "var(--chart-1)",
            "var(--chart-2)",
            "var(--chart-3)",
            "var(--chart-4)",
            "var(--chart-5)",
            "oklch(0.65 0.15 160)",
            "oklch(0.65 0.20 30)",
            "oklch(0.70 0.15 270)",
        ],
    },
    pastel: {
        label: "Pastel",
        colors: [
            "oklch(0.82 0.10 20)",
            "oklch(0.82 0.10 80)",
            "oklch(0.82 0.10 140)",
            "oklch(0.82 0.10 200)",
            "oklch(0.82 0.10 260)",
            "oklch(0.82 0.10 320)",
            "oklch(0.78 0.12 50)",
            "oklch(0.78 0.12 170)",
        ],
    },
    vivid: {
        label: "Vivid",
        colors: [
            "oklch(0.65 0.25 30)",
            "oklch(0.65 0.25 90)",
            "oklch(0.65 0.25 150)",
            "oklch(0.65 0.25 210)",
            "oklch(0.65 0.25 270)",
            "oklch(0.65 0.25 330)",
            "oklch(0.55 0.20 60)",
            "oklch(0.55 0.20 180)",
        ],
    },
    warm: {
        label: "Warm",
        colors: [
            "oklch(0.70 0.20 25)",
            "oklch(0.75 0.18 50)",
            "oklch(0.65 0.22 15)",
            "oklch(0.72 0.16 70)",
            "oklch(0.68 0.19 40)",
            "oklch(0.60 0.21 5)",
            "oklch(0.78 0.14 60)",
            "oklch(0.63 0.23 35)",
        ],
    },
    cool: {
        label: "Cool",
        colors: [
            "oklch(0.65 0.18 220)",
            "oklch(0.70 0.16 250)",
            "oklch(0.60 0.20 190)",
            "oklch(0.72 0.14 280)",
            "oklch(0.67 0.17 170)",
            "oklch(0.58 0.19 240)",
            "oklch(0.75 0.13 200)",
            "oklch(0.62 0.21 260)",
        ],
    },
    monochrome: {
        label: "Monochrome",
        colors: [
            "oklch(0.40 0 0)",
            "oklch(0.50 0 0)",
            "oklch(0.58 0 0)",
            "oklch(0.65 0 0)",
            "oklch(0.72 0 0)",
            "oklch(0.78 0 0)",
            "oklch(0.84 0 0)",
            "oklch(0.90 0 0)",
        ],
    },
};

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
function MonthlyBarChart({ transactions, incomeColor, expenseColor }: { transactions: Transaction[]; incomeColor: string; expenseColor: string }) {
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
function CategoryPieChart({ transactions, type, pieColors }: { transactions: Transaction[]; type: "expense" | "income"; pieColors: string[] }) {
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
                            style={{ background: pieColors[i % pieColors.length] }}
                        />
                        {d.category}: {formatCurrency(d.amount)} ({(d.amount / total * 100).toFixed(1)}%)
                    </Badge>
                ))}
            </div>
        </div>
    );
}

// --- Chart 3: Daily Cash Flow Area Chart ---
function DailyCashFlowChart({ transactions, color }: { transactions: Transaction[]; color: string }) {
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
function WalletComparisonChart({ wallets, transactions, color }: { wallets: Wallet[]; transactions: Transaction[]; color: string }) {
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

// --- Category Ranking ---
function CategoryRanking({ transactions, type, pieColors }: { transactions: Transaction[]; type: "expense" | "income"; pieColors: string[] }) {
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
                const Icon = getCategoryIcon(d.category);
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

// --- Color Palette Selector ---
function PaletteSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Colors:</span>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-[150px]" size="sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(PIE_COLOR_PALETTES).map(([key, palette]) => (
                        <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {palette.colors.slice(0, 5).map((c, i) => (
                                        <span
                                            key={i}
                                            className="inline-block size-2.5 rounded-full"
                                            style={{ background: c }}
                                        />
                                    ))}
                                </div>
                                {palette.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// --- Main Analytics Component ---
const Analytics: React.FC<AnalyticsProps> = ({ transactions, wallets }) => {
    const [period, setPeriod] = useState("6");
    const [analyticsTab, setAnalyticsTab] = useState("overall");
    const [paletteKey, setPaletteKey] = useLocalStorage("analytics-palette", "default");

    const pieColors = PIE_COLOR_PALETTES[paletteKey]?.colors ?? PIE_COLOR_PALETTES.default.colors;

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
            {/* Period & Palette selectors */}
            <div className="flex flex-wrap items-center gap-4">
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
                <PaletteSelector value={paletteKey} onChange={setPaletteKey} />
            </div>

            {/* Sub-tabs */}
            <Tabs value={analyticsTab} onValueChange={setAnalyticsTab}>
                <TabsList>
                    <TabsTrigger value="overall">Overall</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="expense">Expense</TabsTrigger>
                </TabsList>

                {/* --- Overall Tab --- */}
                <TabsContent value="overall" className="flex flex-col gap-6">
                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Monthly Income vs Expense</h3>
                        <MonthlyBarChart transactions={filtered} incomeColor={pieColors[0]} expenseColor={pieColors[1]} />
                    </section>

                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Expense Category Breakdown</h3>
                        <CategoryPieChart transactions={filtered} type="expense" pieColors={pieColors} />
                    </section>

                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Income Category Breakdown</h3>
                        <CategoryPieChart transactions={filtered} type="income" pieColors={pieColors} />
                    </section>

                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Cumulative Cash Flow</h3>
                        <DailyCashFlowChart transactions={filtered} color={pieColors[4 % pieColors.length]} />
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
                        <CategoryPieChart transactions={filtered} type="income" pieColors={pieColors} />
                    </section>

                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Income Ranking by Category</h3>
                        <CategoryRanking transactions={filtered} type="income" pieColors={pieColors} />
                    </section>
                </TabsContent>

                {/* --- Expense Tab --- */}
                <TabsContent value="expense" className="flex flex-col gap-6">
                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Expense Category Breakdown</h3>
                        <CategoryPieChart transactions={filtered} type="expense" pieColors={pieColors} />
                    </section>

                    <section className="border border-dashed rounded-lg p-4 bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Expense Ranking by Category</h3>
                        <CategoryRanking transactions={filtered} type="expense" pieColors={pieColors} />
                    </section>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Analytics;
