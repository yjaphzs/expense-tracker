import React from "react";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/shadcn-io/copy-button";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { formatAmount, formatCurrency } from "@/lib/utils";

interface BalanceSummaryProps {
    balance: number;
    income: number;
    expenses: number;
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({
    balance,
    income,
    expenses,
}) => (
    <div className="flex flex-col gap-1 border border-dashed bg-muted/30 rounded-lg w-full py-6 px-4 sm:px-6 mt-4">
        <div className="flex items-center justify-between gap-3">
            <div className="flex shrink-0 items-center gap-2">
                <CopyButton
                    variant="default"
                    size="sm"
                    className="max-md:size-10 max-md:[&_svg]:size-4"
                    aria-label="Copy total balance"
                    content={formatAmount(balance)}
                />
                {/* Icon-only on phones so a long balance keeps its room. */}
                {balance > 0 && (
                    <Badge variant="secondary">
                        <TrendingUpIcon className="text-primary" />
                        <span className="max-sm:sr-only">Positive</span>
                    </Badge>
                )}
                {balance < 0 && (
                    <Badge variant="destructive">
                        <TrendingDownIcon />
                        <span className="max-sm:sr-only">Negative</span>
                    </Badge>
                )}
            </div>
            <div className="min-w-0 truncate text-end text-2xl font-mono font-bold sm:text-3xl">
                {formatCurrency(balance)}
            </div>
        </div>
        <div className="text-end text-xs text-muted-foreground">
            Total Balance
        </div>
        <div className="flex flex-row gap-3 mt-3">
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-dashed px-3 sm:px-4 py-2 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Income</div>
                <div className="max-w-full truncate text-base font-mono font-bold text-emerald-700 dark:text-emerald-400 sm:text-lg">
                    {formatCurrency(income)}
                </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-dashed px-3 sm:px-4 py-2 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Expenses</div>
                <div className="max-w-full truncate text-base font-mono font-bold text-rose-700 dark:text-rose-400 sm:text-lg">
                    {formatCurrency(expenses)}
                </div>
            </div>
        </div>
    </div>
);

export default BalanceSummary;
