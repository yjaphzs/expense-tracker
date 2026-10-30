import { FONT_SANS, PRINT } from "@/lib/export/theme";

/** Header band, details, tiles, tables, category bars, chart, disclaimer. */
export const COMPONENT_STYLES = `
.band { background: ${PRINT.ink}; color: ${PRINT.white}; border-radius: 10px 10px 0 0; padding: 16px 20px 18px; }
.band-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.brand { display: flex; align-items: center; gap: 10px; font-size: 10pt; font-weight: 700; }
.brand svg { display: block; width: 28px; height: 28px; }
.chip { border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 999px; padding: 2px 10px; font-size: 7.5pt; color: ${PRINT.hairline}; white-space: nowrap; }
.doc-title { margin: 14px 0 0; font-size: 21pt; font-weight: 800; line-height: 1.15; letter-spacing: -0.01em; }
.doc-subtitle { margin: 4px 0 0; font-size: 10.5pt; color: ${PRINT.bandText}; }
.stripe { height: 4px; background: ${PRINT.stripe}; border-radius: 0 0 4px 4px; }

.meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px 20px; margin: 16px 0 0; }
.meta dt { margin: 0; font-size: 7.5pt; color: ${PRINT.muted}; }
.meta dd { margin: 2px 0 0; font-size: 10pt; font-weight: 600; }

.tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
.tile { border: 1px solid ${PRINT.hairline}; border-radius: 8px; background: ${PRINT.panel}; padding: 10px 12px; }
.tile--hero { border-color: ${PRINT.amber}; box-shadow: inset 0 3px 0 ${PRINT.amber}; }
.tile-label { font-size: 7.5pt; color: ${PRINT.muted}; }
.tile-value { margin-top: 2px; font-size: 14pt; font-weight: 700; line-height: 1.2; }
.tile--hero .tile-value { font-size: 17pt; }

.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 24px 0 8px; }
.section-title { margin: 0; font-size: 12pt; font-weight: 700; }
.section-meta { font-size: 8.5pt; color: ${PRINT.muted}; text-align: right; }

.data-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
.data-table th { text-align: left; font-size: 8pt; font-weight: 600; color: ${PRINT.inkSoft}; background: ${PRINT.panel}; border-bottom: 1.5px solid ${PRINT.ink}; padding: 6px 8px; }
.data-table td { padding: 5px 8px; border-bottom: 1px solid ${PRINT.hairline}; vertical-align: top; }
.data-table tbody tr:nth-child(even) td { background: ${PRINT.zebra}; }
.data-table tfoot td { font-weight: 700; border-top: 1.5px solid ${PRINT.ink}; border-bottom: 0; }
.data-table .num { text-align: right; white-space: nowrap; }
.data-table th.num { font-family: ${FONT_SANS}; }
.data-table .bar-cell { width: 34%; }
.bar { height: 8px; border-radius: 999px; background: ${PRINT.hairline}; overflow: hidden; margin-top: 4px; }
.bar > span { display: block; height: 100%; border-radius: 999px; background: ${PRINT.amber}; }
.bar--warn > span { background: #f97316; }
.bar--over > span { background: ${PRINT.expense}; }
.month-row td { background: ${PRINT.white} !important; font-weight: 700; color: ${PRINT.amberInk}; border-bottom: 1.5px solid ${PRINT.hairline}; padding-top: 10px; }

.chart svg { display: block; width: 100%; height: auto; }
.chart-caption { margin: 4px 0 0; font-size: 7.5pt; color: ${PRINT.muted}; }

.disclaimer { margin-top: 24px; padding: 10px 12px; border: 1px dashed ${PRINT.bandText}; border-radius: 8px; font-size: 7.5pt; line-height: 1.5; color: ${PRINT.muted}; }
.disclaimer strong { color: ${PRINT.inkSoft}; }
`;
