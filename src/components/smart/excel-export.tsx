import React, { useState, useMemo } from "react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, isWithinInterval } from "date-fns";
import XLSX from "xlsx-js-style";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheetIcon, DownloadIcon } from "lucide-react";
import type { Transaction, Wallet } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ExcelExportProps {
    transactions: Transaction[];
    wallets: Wallet[];
}

type RangePreset = "this-month" | "last-month" | "last-3" | "last-6" | "this-year" | "last-year" | "all";

const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
    { value: "this-month", label: "This Month" },
    { value: "last-month", label: "Last Month" },
    { value: "last-3", label: "Last 3 Months" },
    { value: "last-6", label: "Last 6 Months" },
    { value: "this-year", label: "This Year" },
    { value: "last-year", label: "Last Year" },
    { value: "all", label: "All Time" },
];

function getDateRange(preset: RangePreset): { start: Date; end: Date } | null {
    const now = new Date();
    switch (preset) {
        case "this-month":
            return { start: startOfMonth(now), end: endOfMonth(now) };
        case "last-month": {
            const prev = subMonths(now, 1);
            return { start: startOfMonth(prev), end: endOfMonth(prev) };
        }
        case "last-3":
            return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
        case "last-6":
            return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
        case "this-year":
            return { start: startOfYear(now), end: endOfYear(now) };
        case "last-year": {
            const prev = subYears(now, 1);
            return { start: startOfYear(prev), end: endOfYear(prev) };
        }
        case "all":
            return null;
    }
}

function filterTransactions(transactions: Transaction[], preset: RangePreset): Transaction[] {
    const range = getDateRange(preset);
    if (!range) return transactions;
    return transactions.filter((t) => {
        const d = parseISO(t.date);
        return isWithinInterval(d, { start: range.start, end: range.end });
    });
}

const ExcelExport: React.FC<ExcelExportProps> = ({ transactions, wallets }) => {
    const [range, setRange] = useState<RangePreset>("this-month");

    const filtered = useMemo(() => filterTransactions(transactions, range), [transactions, range]);

    const walletMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const w of wallets) map.set(w.id, w.name);
        return map;
    }, [wallets]);

    const handleExport = () => {
        if (filtered.length === 0) {
            toast.error("No transactions to export for this period.");
            return;
        }

        // --- Theme-matched color palette ---
        const colors = {
            primary: "FBB217",       // golden foreground
            primaryLight: "3D2E0A",  // muted gold on dark
            income: "22C55E",        // green-500
            incomeBg: "0D2818",      // dark green tint
            expense: "EF4444",       // red-500
            expenseBg: "2D0F0F",     // dark red tint
            headerText: "090909",    // dark background text
            dark: "090909",          // background
            darkAlt: "121212",       // alternating row
            foreground: "FBB217",    // golden foreground
            muted: "A0A0A0",
            border: "2A2A2A",
            white: "F5F5F5",
            netPositive: "22C55E",   // green
            netNegative: "EF4444",   // red
        };

        const headerStyle = {
            font: { bold: true, color: { rgb: colors.dark }, sz: 11 },
            fill: { fgColor: { rgb: colors.primary } },
            alignment: { horizontal: "center" as const, vertical: "center" as const },
            border: {
                bottom: { style: "thin" as const, color: { rgb: colors.primary } },
            },
        };

        const currencyFmt = '#,##0.00';

        // --- Transactions sheet ---
        const txRows = filtered
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((t) => ({
                Date: format(parseISO(t.date), "yyyy-MM-dd"),
                Type: t.type === "income" ? "Income" : "Expense",
                Category: t.category,
                Description: t.description || "",
                Amount: t.amount,
                Wallet: walletMap.get(t.walletId) ?? t.walletId,
            }));

        const wsTx = XLSX.utils.json_to_sheet(txRows);
        wsTx["!cols"] = [
            { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 },
        ];

        // Style header row
        const txHeaders = ["A1", "B1", "C1", "D1", "E1", "F1"];
        for (const ref of txHeaders) {
            if (wsTx[ref]) wsTx[ref].s = headerStyle;
        }

        // Style data rows (text color only, no background)
        for (let i = 0; i < txRows.length; i++) {
            const row = i + 2;
            const isIncome = txRows[i].Type === "Income";
            const typeColor = isIncome ? colors.income : colors.expense;

            const ref_B = `B${row}`;
            if (wsTx[ref_B]) {
                wsTx[ref_B].s = { font: { bold: true, color: { rgb: typeColor } } };
            }
            const ref_E = `E${row}`;
            if (wsTx[ref_E]) {
                wsTx[ref_E].s = {
                    font: { color: { rgb: typeColor } },
                    numFmt: currencyFmt,
                    alignment: { horizontal: "right" as const },
                };
                wsTx[ref_E].z = currencyFmt;
            }
        }

        // --- Summary sheet ---
        const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

        const categoryMap = new Map<string, { type: string; amount: number }>();
        for (const t of filtered) {
            const key = `${t.type}-${t.category}`;
            const prev = categoryMap.get(key);
            if (prev) prev.amount += t.amount;
            else categoryMap.set(key, { type: t.type === "income" ? "Income" : "Expense", amount: t.amount });
        }

        const summaryRows = [
            { Label: "Total Income", Value: income },
            { Label: "Total Expenses", Value: expense },
            { Label: "Net Balance", Value: income - expense },
            { Label: "", Value: "" },
            { Label: "Category Breakdown", Value: "" },
            ...Array.from(categoryMap.entries())
                .sort(([, a], [, b]) => b.amount - a.amount)
                .map(([key, val]) => ({
                    Label: `${val.type} — ${key.split("-").slice(1).join("-")}`,
                    Value: val.amount,
                })),
        ];

        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        wsSummary["!cols"] = [{ wch: 35 }, { wch: 18 }];

        // Style summary header
        if (wsSummary["A1"]) wsSummary["A1"].s = headerStyle;
        if (wsSummary["B1"]) wsSummary["B1"].s = headerStyle;

        // Style summary data rows
        const summaryLabelStyles: Record<string, object> = {
            "Total Income": { font: { bold: true, color: { rgb: colors.income }, sz: 11 } },
            "Total Expenses": { font: { bold: true, color: { rgb: colors.expense }, sz: 11 } },
            "Net Balance": { font: { bold: true, color: { rgb: income - expense >= 0 ? colors.netPositive : colors.netNegative }, sz: 12 } },
            "Category Breakdown": { font: { bold: true, color: { rgb: colors.primary }, sz: 11 } },
        };

        for (let i = 0; i < summaryRows.length; i++) {
            const row = i + 2;
            const label = summaryRows[i].Label;
            const style = summaryLabelStyles[label];
            if (style) {
                if (wsSummary[`A${row}`]) wsSummary[`A${row}`].s = style;
                if (wsSummary[`B${row}`]) {
                    wsSummary[`B${row}`].s = { ...style, numFmt: currencyFmt, alignment: { horizontal: "right" as const } };
                    wsSummary[`B${row}`].z = currencyFmt;
                }
            } else if (label && typeof summaryRows[i].Value === "number") {
                const isIncomeCat = label.startsWith("Income");
                const catColor = isIncomeCat ? colors.income : colors.expense;
                if (wsSummary[`B${row}`]) {
                    wsSummary[`B${row}`].s = { font: { color: { rgb: catColor } }, numFmt: currencyFmt, alignment: { horizontal: "right" as const } };
                    wsSummary[`B${row}`].z = currencyFmt;
                }
            }
        }

        // --- Monthly breakdown sheet ---
        const monthlyMap = new Map<string, { income: number; expense: number }>();
        for (const t of filtered) {
            const key = format(parseISO(t.date), "yyyy-MM");
            if (!monthlyMap.has(key)) monthlyMap.set(key, { income: 0, expense: 0 });
            const entry = monthlyMap.get(key)!;
            if (t.type === "income") entry.income += t.amount;
            else entry.expense += t.amount;
        }

        const monthlyRows = Array.from(monthlyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({
                Month: format(parseISO(`${month}-01`), "MMM yyyy"),
                Income: data.income,
                Expenses: data.expense,
                Net: data.income - data.expense,
            }));

        const wsMonthly = XLSX.utils.json_to_sheet(monthlyRows);
        wsMonthly["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

        // Style monthly header
        for (const ref of ["A1", "B1", "C1", "D1"]) {
            if (wsMonthly[ref]) wsMonthly[ref].s = headerStyle;
        }

        // Style monthly data rows (text color only, no background)
        for (let i = 0; i < monthlyRows.length; i++) {
            const row = i + 2;
            const net = monthlyRows[i].Net;

            if (wsMonthly[`A${row}`]) wsMonthly[`A${row}`].s = { font: { bold: true } };
            if (wsMonthly[`B${row}`]) {
                wsMonthly[`B${row}`].s = { font: { color: { rgb: colors.income } }, numFmt: currencyFmt, alignment: { horizontal: "right" as const } };
                wsMonthly[`B${row}`].z = currencyFmt;
            }
            if (wsMonthly[`C${row}`]) {
                wsMonthly[`C${row}`].s = { font: { color: { rgb: colors.expense } }, numFmt: currencyFmt, alignment: { horizontal: "right" as const } };
                wsMonthly[`C${row}`].z = currencyFmt;
            }
            if (wsMonthly[`D${row}`]) {
                wsMonthly[`D${row}`].s = {
                    font: { bold: true, color: { rgb: net >= 0 ? colors.netPositive : colors.netNegative } },
                    numFmt: currencyFmt,
                    alignment: { horizontal: "right" as const },
                };
                wsMonthly[`D${row}`].z = currencyFmt;
            }
        }

        // --- Build workbook ---
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsTx, "Transactions");
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
        XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Breakdown");

        // Generate filename
        const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label ?? range;
        const filename = `expense-tracker-${rangeLabel.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyyMMdd")}.xlsx`;

        XLSX.writeFile(wb, filename);
        toast.success(`Exported ${filtered.length} transactions to ${filename}`);
    };

    const incomeTotal = useMemo(() => filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), [filtered]);
    const expenseTotal = useMemo(() => filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0), [filtered]);

    return (
        <section className="border border-dashed rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheetIcon className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Export to Excel</h3>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Select value={range} onValueChange={(v) => setRange(v as RangePreset)}>
                    <SelectTrigger className="w-[180px]" size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {RANGE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
                    <DownloadIcon className="size-4 mr-1.5" />
                    Export ({filtered.length} transactions)
                </Button>
            </div>
            {filtered.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                    <span>Income: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(incomeTotal)}</strong></span>
                    <span>Expenses: <strong className="text-red-600 dark:text-red-400">{formatCurrency(expenseTotal)}</strong></span>
                    <span>Net: <strong className={incomeTotal - expenseTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>{formatCurrency(incomeTotal - expenseTotal)}</strong></span>
                </div>
            )}
        </section>
    );
};

export default ExcelExport;
