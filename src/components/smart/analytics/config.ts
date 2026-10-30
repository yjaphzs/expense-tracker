import { parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import type { Transaction } from "@/types/transaction";

export const ANALYTICS_VIEWS = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "overall", label: "Overall" },
    { value: "income", label: "Income" },
    { value: "expense", label: "Expense" },
];

export const PERIOD_OPTIONS = [
    { value: "3", label: "Last 3 months" },
    { value: "6", label: "Last 6 months" },
    { value: "12", label: "Last 12 months" },
    { value: "all", label: "All time" },
];

export const PIE_COLOR_PALETTES: Record<string, { label: string; colors: string[] }> = {
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

export function filterByPeriod(transactions: Transaction[], months: string) {
    if (months === "all") return transactions;
    const now = new Date();
    const start = startOfMonth(subMonths(now, parseInt(months)));
    const end = endOfMonth(now);
    return transactions.filter((t) => {
        const d = parseISO(t.date);
        return isWithinInterval(d, { start, end });
    });
}
