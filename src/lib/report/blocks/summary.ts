import { escapeHtml } from "@/lib/report/format";

/** Label/value rows under the header; rows with no value are left out. */
export function renderDetails(rows: Array<[label: string, value: string | null | undefined]>): string {
  const items = rows
    .filter((row): row is [string, string] => !!row[1]?.trim())
    .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");
  return items ? `<dl class="meta">${items}</dl>` : "";
}

export interface StatTile {
  label: string;
  /** Already formatted; escaped here. */
  value: string;
  /** The headline figure: larger, with the amber accent. */
  hero?: boolean;
  tone?: "income" | "expense";
}

export function renderTiles(tiles: StatTile[]): string {
  const cells = tiles
    .map((tile) => {
      const tileClass = tile.hero ? "tile tile--hero" : "tile";
      const tone = tile.tone ? ` ${tile.tone}` : "";
      return `<div class="${tileClass}"><div class="tile-label">${escapeHtml(tile.label)}</div><div class="tile-value mono${tone}">${escapeHtml(tile.value)}</div></div>`;
    })
    .join("");
  return `<div class="tiles">${cells}</div>`;
}

/** Section heading with a right-aligned note (already-escaped HTML). */
export function renderSectionHead(title: string, metaHtml = ""): string {
  return `<div class="section-head"><h2 class="section-title">${escapeHtml(title)}</h2><div class="section-meta">${metaHtml}</div></div>`;
}
