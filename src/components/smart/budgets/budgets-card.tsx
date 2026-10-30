"use client";

import { PiggyBankIcon, SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTracker } from "@/context/tracker-context";
import { budgetProgress, monthOf, type BudgetProgress } from "@/lib/budgets";
import { parseLocalDate, todayStr } from "@/lib/recurring-schedule";
import { cn, formatCurrency } from "@/lib/utils";

const BAR = { ok: "bg-primary", warn: "bg-orange-500", over: "bg-red-600" };

function BudgetBar({ progress }: { progress: BudgetProgress }) {
  const { label, spent, budget, ratio, state } = progress;
  const left = budget.amount - spent;
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {formatCurrency(spent)} of {formatCurrency(budget.amount)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} budget`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(ratio * 100))}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full rounded-full transition-[width]", BAR[state])} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
      <span className={cn("text-xs", state === "over" ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground")}>
        {left >= 0 ? `${formatCurrency(left)} left` : `${formatCurrency(-left)} over`}
      </span>
    </li>
  );
}

/** Home: this month's budgets with progress bars, or a prompt to set one. */
export function BudgetsCard() {
  const { data, dialogs } = useTracker();
  const today = todayStr();
  const progress = budgetProgress(data.budgets, data.transactions, monthOf(today));
  const monthName = parseLocalDate(today).toLocaleDateString(undefined, { month: "long" });

  if (progress.length === 0) {
    return (
      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3">
          <PiggyBankIcon className="size-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">Set a monthly limit to see how your spending is going.</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 max-md:h-10" onClick={() => dialogs.setBudgetsOpen(true)}>
          Set a budget
        </Button>
      </div>
    );
  }

  return (
    <section aria-labelledby="budgets-heading" className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="budgets-heading" className="text-lg font-semibold">
          Budgets <span className="text-sm font-normal text-muted-foreground">· {monthName}</span>
        </h2>
        <Button
          variant="outline"
          size="icon-sm"
          className="max-md:size-10"
          aria-label="Edit budgets"
          onClick={() => dialogs.setBudgetsOpen(true)}
        >
          <SettingsIcon className="size-4" />
        </Button>
      </div>
      <ul className="flex flex-col gap-4 rounded-lg border bg-card p-4">
        {progress.map((item) => (
          <BudgetBar key={item.budget.id} progress={item} />
        ))}
      </ul>
    </section>
  );
}
