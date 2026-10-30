import type { BudgetLine, CategoryShare, ReportData, WalletMovement } from "@/lib/export/aggregate";
import { parseLocalDate } from "@/lib/recurring-schedule";
import { escapeHtml, money, percent } from "@/lib/report/format";
import { renderSectionHead } from "@/lib/report/blocks/summary";

const bar = (fraction: number, modifier = "") =>
  `<div class="bar${modifier}"><span style="width:${Math.min(100, Math.max(0, fraction * 100)).toFixed(1)}%"></span></div>`;

/** Each budget: limit, spent, what's left, and a bar that turns orange at 80% and red past 100%. */
export function renderBudgets(lines: BudgetLine[]): string {
  if (lines.length === 0) return "";
  const rows = lines
    .map((line) => {
      const left = line.limit - line.spent;
      const modifier = line.state === "over" ? " bar--over" : line.state === "warn" ? " bar--warn" : "";
      return `<tr><td>${escapeHtml(line.label)}${bar(line.ratio, modifier)}</td><td class="num">${money(line.limit)}</td><td class="num">${money(line.spent)}</td><td class="num ${left < 0 ? "expense" : ""}">${money(left)}</td><td class="num">${percent(line.ratio)}</td></tr>`;
    })
    .join("");
  return `${renderSectionHead("Budgets", "Monthly limits for the period")}
<table class="data-table"><thead><tr><th>Budget</th><th class="num">Limit</th><th class="num">Spent</th><th class="num">Left</th><th class="num">Used</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/** Categories by amount, with a share bar. */
export function renderCategories(title: string, shares: CategoryShare[], tone: "income" | "expense"): string {
  if (shares.length === 0) return "";
  const total = shares.reduce((s, x) => s + x.amount, 0);
  const rows = shares
    .map((s) => `<tr><td>${escapeHtml(s.category)}</td><td class="bar-cell">${bar(s.share)}</td><td class="num">${percent(s.share)}</td><td class="num ${tone}">${money(s.amount)}</td></tr>`)
    .join("");
  return `${renderSectionHead(title)}
<table class="data-table"><thead><tr><th>Category</th><th>Share</th><th class="num"></th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td>Total</td><td></td><td class="num">100%</td><td class="num ${tone}">${money(total)}</td></tr></tfoot></table>`;
}

/** How each wallet's balance moved: income, spending, transfers, and the net change. */
export function renderWallets(wallets: WalletMovement[]): string {
  if (wallets.length === 0) return "";
  const rows = wallets
    .map((w) => `<tr><td>${escapeHtml(w.name)}</td><td class="num income">${money(w.income)}</td><td class="num expense">${money(w.expense)}</td><td class="num">${money(w.transfersIn - w.transfersOut)}</td><td class="num ${w.net < 0 ? "expense" : "income"}">${money(w.net)}</td></tr>`)
    .join("");
  return `${renderSectionHead("Wallets", "Change over the period")}
<table class="data-table"><thead><tr><th>Wallet</th><th class="num">Income</th><th class="num">Expenses</th><th class="num">Transfers</th><th class="num">Net change</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const day = (date: string) => parseLocalDate(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const monthName = (month: string) => parseLocalDate(`${month}-01`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

/** Every transaction, oldest first, under a heading row per month. */
export function renderTransactions(report: ReportData): string {
  if (report.transactions.length === 0) return "";
  let month = "";
  const rows = report.transactions
    .map((t) => {
      const heading = t.date.slice(0, 7) !== month ? `<tr class="month-row"><td colspan="5">${escapeHtml(monthName((month = t.date.slice(0, 7))))}</td></tr>` : "";
      const sign = t.type === "income" ? "+" : "-";
      return `${heading}<tr><td class="mono">${escapeHtml(day(t.date))}</td><td>${escapeHtml(t.description || t.category)}</td><td>${escapeHtml(t.category)}</td><td>${escapeHtml(report.walletNames[t.walletId] ?? "")}</td><td class="num ${t.type}">${sign}${money(t.amount)}</td></tr>`;
    })
    .join("");
  const { income, expense, net } = report.totals;
  return `${renderSectionHead("Transactions", `${report.totals.count} in this period`)}
<table class="data-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Wallet</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td colspan="4">Income ${money(income)} · Expenses ${money(expense)} · Net</td><td class="num ${net < 0 ? "expense" : "income"}">${money(net)}</td></tr></tfoot></table>`;
}
