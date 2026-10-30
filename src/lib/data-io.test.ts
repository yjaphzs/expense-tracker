import { describe, expect, it } from "vitest";

import { parseCsv, toCsv } from "./csv";
import { CsvFormatError, parseTransactionsCsv, transactionsToCsv } from "./csv-transactions";
import { ImportError, serializeBackup, validateBackup } from "./import-validation";
import { emptyState } from "./tracker-state";

const wallets = [{ id: "cash", name: "Cash", type: "cash" as const }];

describe("csv", () => {
  it("quotes commas, quotes and line breaks, and parses them back", () => {
    const rows = [["a", 'say "hi"', "x,y", "two\nlines", 5]];
    expect(parseCsv(toCsv(rows))).toEqual([["a", 'say "hi"', "x,y", "two\nlines", "5"]]);
  });

  it("drops blank lines and a byte-order mark", () => {
    expect(parseCsv("﻿a,b\r\n\r\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});

describe("csv transactions", () => {
  it("round-trips an export, creating unknown wallets and categories", () => {
    const csv = transactionsToCsv(
      [
        { id: "1", type: "expense", category: "Pets", amount: 250.5, description: "Food, dog", date: "2026-10-02", walletId: "w2" },
        { id: "2", type: "income", category: "Salary", amount: 1000, description: "", date: "2026-10-01", walletId: "cash" },
      ],
      [...wallets, { id: "w2", name: "Maya", type: "e-wallet-card" }],
    );
    const result = parseTransactionsCsv(csv, wallets, []);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({ category: "Pets", amount: 250.5, description: "Food, dog" });
    expect(result.newWallets.map((w) => w.name)).toEqual(["Maya"]);
    expect(result.newCategories.map((c) => [c.name, c.type])).toEqual([["Pets", "expense"]]);
    expect(result.transactions[1].walletId).toBe("cash");
  });

  it("accepts M/D/YYYY dates, peso signs and any column order; skips bad rows", () => {
    const csv = [
      "amount,wallet,type,date,category",
      '"₱1,234.00",cash,Expense,10/31/2026,food',
      "50,Cash,Transfer out,2026-10-01,Transfer",
      "abc,Cash,Expense,2026-10-01,Food",
      "10,Cash,Expense,2026-02-30,Food",
    ].join("\n");
    const result = parseTransactionsCsv(csv, wallets, []);
    expect(result.transactions).toEqual([
      { type: "expense", category: "Food", amount: 1234, date: "2026-10-31", walletId: "cash", description: "" },
    ]);
    expect(result.skipped.map((s) => s.row)).toEqual([3, 4, 5]);
  });

  it("explains a missing header", () => {
    expect(() => parseTransactionsCsv("2026-10-01,Expense,10", wallets, [])).toThrow(CsvFormatError);
  });
});

describe("backup validation", () => {
  const backup = { transactions: [], recurring: [], wallets, autosave: true };

  it("accepts 2.0/2.1 backups without budgets or categories", () => {
    const state = validateBackup(backup);
    expect(state.budgets).toEqual([]);
    expect(state.wallets).toEqual(wallets);
  });

  it("round-trips a full backup", () => {
    const state = { ...emptyState(), wallets, budgets: [{ id: "all", amount: 9000 }] };
    expect(validateBackup(JSON.parse(serializeBackup(state)))).toEqual(state);
  });

  it("uses the fallback autosave for QR payloads and rejects broken files", () => {
    expect(validateBackup({ ...backup, autosave: undefined }, false).autosave).toBe(false);
    expect(() => validateBackup({ ...backup, autosave: undefined })).toThrow(ImportError);
    expect(() => validateBackup({ ...backup, wallets: [{ id: 1 }] })).toThrow(/wallets/);
    expect(() => validateBackup({ ...backup, budgets: "x" })).toThrow(/budgets/);
    expect(() => validateBackup([])).toThrow(ImportError);
  });
});
