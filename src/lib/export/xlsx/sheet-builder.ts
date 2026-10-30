import { DATE_FORMAT, EXPORT_COLORS as C, MONEY_FORMAT, PERCENT_FORMAT } from "@/lib/export/theme";

export type ColumnKind = "text" | "money" | "date" | "percent" | "count";
export type Tone = "income" | "expense" | "net" | "muted" | "accent";
export type CellValue = string | number | null;

export interface Column {
  header: string;
  width: number;
  kind?: ColumnKind;
}

export interface RowOptions {
  /** Colors every money cell (net picks green or red by sign). */
  tone?: Tone;
  bold?: boolean;
  /** Totals row: bold with a dark rule above. */
  total?: boolean;
  /** Per-column tone, overriding `tone`. */
  tones?: readonly (Tone | undefined)[];
}

/** A cell as xlsx-js-style writes it. */
export interface Cell {
  v: string | number;
  t: "s" | "n";
  z?: string;
  s: Record<string, unknown>;
}

export type Sheet = Record<string, unknown>;

const thin = (rgb: string) => ({ style: "thin", color: { rgb } });
const medium = (rgb: string) => ({ style: "medium", color: { rgb } });
const FORMATS: Partial<Record<ColumnKind, string>> = { money: MONEY_FORMAT, date: DATE_FORMAT, percent: PERCENT_FORMAT };
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

/** Excel's serial day number for "YYYY-MM-DD" (a real date cell, sortable and filterable). */
export function excelDate(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return (Date.UTC(y, m - 1, d) - EXCEL_EPOCH) / 86_400_000;
}

export function colName(index: number): string {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}

function toneColor(tone: Tone | undefined, value: CellValue): string | undefined {
  if (tone === "income") return C.income;
  if (tone === "expense") return C.expense;
  if (tone === "muted") return C.muted;
  if (tone === "accent") return C.amberInk;
  if (tone === "net" && typeof value === "number") return value < 0 ? C.expense : C.income;
  return undefined;
}

/** Writes cells at (row, col) into a sheet object and tracks the used range. */
export class SheetWriter {
  readonly sheet: Sheet = {};
  readonly merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
  readonly rowHeights: { hpt?: number }[] = [];
  rows = 0;

  constructor(readonly width: number) {}

  set(r: number, c: number, cell: Cell): void {
    this.sheet[`${colName(c)}${r + 1}`] = cell;
    this.rows = Math.max(this.rows, r + 1);
  }

  /** One full-width line (band, stripe, note), merged across every column. */
  line(r: number, value: string, style: Record<string, unknown>, height?: number): void {
    for (let c = 0; c < this.width; c++) this.set(r, c, { v: c === 0 ? value : "", t: "s", s: style });
    this.merges.push({ s: { r, c: 0 }, e: { r, c: this.width - 1 } });
    if (height) this.rowHeights[r] = { hpt: height };
  }

  cell(r: number, c: number, value: CellValue, kind: ColumnKind, style: Record<string, unknown>): void {
    const z = FORMATS[kind];
    if (typeof value === "number" || (kind === "date" && typeof value === "string" && value)) {
      const v = kind === "date" && typeof value === "string" ? excelDate(value) : (value as number);
      this.set(r, c, { v, t: "n", z, s: z ? { ...style, numFmt: z } : style });
    } else {
      this.set(r, c, { v: value ?? "", t: "s", s: style });
    }
  }

  /** A table: header row, zebra body, and an optional totals row. Returns the next free row. */
  table(start: number, columns: Column[], rows: { values: CellValue[]; options?: RowOptions }[]): number {
    columns.forEach((col, c) =>
      this.set(start, c, {
        v: col.header,
        t: "s",
        s: {
          font: { bold: true, sz: 10, color: { rgb: C.inkSoft } },
          fill: { fgColor: { rgb: C.panel } },
          border: { bottom: medium(C.ink) },
          alignment: { horizontal: col.kind && col.kind !== "text" ? "right" : "left", vertical: "center" },
        },
      }),
    );
    this.rowHeights[start] = { hpt: 20 };
    rows.forEach(({ values, options = {} }, i) => {
      const r = start + 1 + i;
      columns.forEach((col, c) => {
        const kind = col.kind ?? "text";
        const color = toneColor(options.tones?.[c] ?? (kind === "money" ? options.tone : undefined), values[c]);
        this.cell(r, c, values[c], kind, {
          font: { sz: 10, bold: options.bold || options.total, color: { rgb: color ?? C.ink } },
          fill: !options.total && i % 2 === 1 ? { fgColor: { rgb: C.zebra } } : undefined,
          border: options.total ? { top: medium(C.ink) } : { bottom: thin(C.hairline) },
          alignment: { horizontal: kind === "text" ? "left" : "right", vertical: "center", wrapText: kind === "text" },
        });
      });
    });
    return start + 1 + rows.length;
  }

  finish(columns: Column[], extra: Sheet = {}): Sheet {
    return {
      ...this.sheet,
      "!ref": `A1:${colName(this.width - 1)}${Math.max(this.rows, 1)}`,
      "!cols": columns.map((col) => ({ wch: col.width })),
      "!rows": this.rowHeights,
      "!merges": this.merges,
      ...extra,
    };
  }
}
