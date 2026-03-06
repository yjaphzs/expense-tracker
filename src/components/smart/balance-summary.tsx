import React from "react";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/shadcn-io/copy-button";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
    <div className="flex flex-col gap-1 border border-dashed bg-muted/30 rounded-lg w-full py-6 px-6 mt-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <CopyButton
                    variant="default"
                    size="sm"
                    content={formatCurrency(balance)}
                />
                {balance > 0 && (
                    <Badge variant="secondary">
                        <TrendingUpIcon className="text-primary" />
                        Positive
                    </Badge>
                )}
                {balance < 0 && (
                    <Badge variant="destructive">
                        <TrendingDownIcon />
                        Negative
                    </Badge>
                )}
            </div>
            <div className="text-end text-3xl font-mono font-bold">
                {formatCurrency(balance)}
            </div>
        </div>
        <div className="text-end text-xs text-muted-foreground">
            Total Balance
        </div>
        <div className="flex flex-row gap-3 mt-3">
            <div className="flex-1 flex items-center justify-between border border-dashed px-4 py-2 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Income</div>
                <div className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(income)}
                </div>
            </div>
            <div className="flex-1 flex items-center justify-between border border-dashed px-4 py-2 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Expenses</div>
                <div className="text-lg font-mono font-bold text-rose-700 dark:text-rose-400">
                    {formatCurrency(expenses)}
                </div>
            </div>
        </div>
    </div>
);

export default BalanceSummary;
