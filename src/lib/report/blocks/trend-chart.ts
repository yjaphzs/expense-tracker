import type { PeriodRow } from "@/lib/export/breakdowns";
import { PRINT } from "@/lib/export/theme";
import { escapeHtml, money } from "@/lib/report/format";
import { renderSectionHead } from "@/lib/report/blocks/summary";

const W = 680;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 26, left: 8 };

/** Income and expense bars per month. Only drawn when the period spans two months or more. */
export function renderMonthlyChart(months: PeriodRow[]): string {
  if (months.length < 2) return "";
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const slot = (W - PAD.left - PAD.right) / months.length;
  const barW = Math.min(22, slot / 3);
  const plotH = H - PAD.top - PAD.bottom;
  const y = (value: number) => PAD.top + plotH - (value / max) * plotH;

  const bars = months
    .map((m, i) => {
      const x = PAD.left + i * slot + slot / 2;
      const label = escapeHtml(m.label);
      return `
<rect x="${(x - barW - 1).toFixed(1)}" y="${y(m.income).toFixed(1)}" width="${barW.toFixed(1)}" height="${(PAD.top + plotH - y(m.income)).toFixed(1)}" rx="2" fill="${PRINT.income}"><title>${label} income ${money(m.income)}</title></rect>
<rect x="${(x + 1).toFixed(1)}" y="${y(m.expense).toFixed(1)}" width="${barW.toFixed(1)}" height="${(PAD.top + plotH - y(m.expense)).toFixed(1)}" rx="2" fill="${PRINT.expense}"><title>${label} expenses ${money(m.expense)}</title></rect>
<text x="${x.toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="9" fill="${PRINT.muted}">${label}</text>`;
    })
    .join("");

  return `${renderSectionHead("By month", `<span class="income">■</span> Income · <span class="expense">■</span> Expenses`)}
<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Income and expenses by month">
<line x1="${PAD.left}" x2="${W - PAD.right}" y1="${PAD.top + plotH}" y2="${PAD.top + plotH}" stroke="${PRINT.hairline}" />${bars}
</svg><p class="chart-caption">Tallest bar: ${money(max)}</p></div>`;
}
