import { describe, expect, it } from "vitest";

import type { Budget, CustomCategory, Transaction } from "@/types/transaction";
import { budgetProgress, crossedBudgets, monthSpending } from "./budgets";
import { categoryNames, categoryUsage, renameCategory, validateCategoryName } from "./categories";
import { activeFilterCount, applyFilter, EMPTY_FILTER, filteredNet, presetRange } from "./transaction-filters";
import { buildTransferLegs, orderLegs, transferInputFrom } from "./transfers";

let n = 0;
const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: `t${++n}`,
  type: "expense",
  category: "Food",
  amount: 100,
  description: "",
  date: "2026-10-15",
  walletId: "cash",
  ...over,
});
const wallets = [
  { id: "cash", name: "Cash", type: "cash" as const },
  { id: "gcash", name: "GCash", type: "e-wallet-card" as const },
];

describe("transfers", () => {
  it("builds an expense leg and an income leg sharing one id", () => {
    const [from, to] = buildTransferLegs(
      { fromWalletId: "gcash", toWalletId: "cash", amount: 500, description: "", date: "2026-10-01" },
      "x",
      "Cash out",
    );
    expect([from.type, from.walletId, to.type, to.walletId]).toEqual(["expense", "gcash", "income", "cash"]);
    expect(from.transferId).toBe("x");
    expect(to.transfer).toBe(true);
  });

  it("orders legs and reads them back into form values", () => {
    const out = tx({ id: "a", type: "expense", walletId: "gcash", transfer: true, category: "Transfer", amount: 70 });
    const inn = tx({ id: "b", type: "income", walletId: "cash", transfer: true, category: "Transfer", amount: 70 });
    const legs = orderLegs(inn, out)!;
    expect(legs.map((t) => t.id)).toEqual(["a", "b"]);
    expect(transferInputFrom(legs)).toMatchObject({ fromWalletId: "gcash", toWalletId: "cash", amount: 70 });
    expect(orderLegs(inn, undefined)).toBeNull();
  });
});

describe("filters", () => {
  const list = [
    tx({ description: "Lunch at cafe", date: "2026-10-30" }),
    tx({ category: "Bills", description: "Internet", amount: 1499, walletId: "gcash", date: "2026-09-02" }),
    tx({ type: "income", category: "Salary", amount: 25000, walletId: "gcash", date: "2026-10-01" }),
  ];
  const today = new Date(2026, 9, 31);

  it("searches description, category, wallet and amount", () => {
    const search = (query: string) => applyFilter(list, { ...EMPTY_FILTER, query }, wallets, today).length;
    expect(search("cafe")).toBe(1);
    expect(search("bills")).toBe(1);
    expect(search("gcash")).toBe(2);
    expect(search("₱1,499")).toBe(1);
  });

  it("combines categories, wallets and date presets", () => {
    const thisMonth = { ...EMPTY_FILTER, datePreset: "this-month" as const };
    expect(applyFilter(list, thisMonth, wallets, today)).toHaveLength(2);
    expect(applyFilter(list, { ...thisMonth, walletIds: ["gcash"] }, wallets, today)).toHaveLength(1);
    expect(presetRange({ ...EMPTY_FILTER, datePreset: "last-month" }, today)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(activeFilterCount({ ...thisMonth, categories: ["Food"], query: "x" })).toBe(2);
  });

  it("nets income against expenses, ignoring transfers", () => {
    expect(filteredNet([...list, tx({ transfer: true, category: "Transfer", amount: 999 })])).toBe(25000 - 100 - 1499);
  });
});

describe("budgets", () => {
  const budgets: Budget[] = [
    { id: "food", category: "Food", amount: 1000 },
    { id: "all", amount: 2000 },
  ];
  const spent = [tx({ amount: 700 }), tx({ amount: 300, transfer: true, category: "Transfer" }), tx({ amount: 50, date: "2026-09-01" })];

  it("counts only this month's expenses, never transfers", () => {
    expect(monthSpending(spent, "2026-10")).toBe(700);
    expect(monthSpending(spent, "2026-10", "Food")).toBe(700);
  });

  it("lists the whole-month budget first, with warn and over states", () => {
    const progress = budgetProgress(budgets, [...spent, tx({ amount: 200, category: "Bills" })], "2026-10");
    expect(progress.map((p) => [p.label, p.state])).toEqual([
      ["This month", "ok"],
      ["Food", "ok"],
    ]);
    expect(budgetProgress(budgets, [tx({ amount: 850 })], "2026-10")[1].state).toBe("warn");
  });

  it("reports a budget once when an expense crosses 80% or 100%", () => {
    expect(crossedBudgets(budgets, spent, { type: "expense", category: "Food", amount: 150, date: "2026-10-20" }).map((p) => p.label)).toEqual(["Food"]);
    expect(crossedBudgets(budgets, spent, { type: "expense", category: "Food", amount: 10, date: "2026-10-20" })).toEqual([]);
    expect(crossedBudgets(budgets, spent, { type: "income", category: "Food", amount: 5000, date: "2026-10-20" })).toEqual([]);
  });
});

describe("categories", () => {
  const custom: CustomCategory[] = [{ id: "c1", name: "Pets", type: "expense", icon: "pet" }];

  it("puts custom categories before Other", () => {
    const names = categoryNames("expense", custom);
    expect(names.slice(-2)).toEqual(["Pets", "Other"]);
    expect(categoryNames("income", custom)).not.toContain("Pets");
  });

  it("rejects empty, duplicate and built-in names", () => {
    expect(validateCategoryName(" ", "expense", custom)).toMatch(/Enter/);
    expect(validateCategoryName("food", "expense", custom)).toMatch(/exists/);
    expect(validateCategoryName("pets", "expense", custom)).toMatch(/exists/);
    expect(validateCategoryName("Pets", "expense", custom, "c1")).toBeNull();
    expect(validateCategoryName("Pets", "income", custom)).toBeNull();
  });

  it("renames everything filed under a category", () => {
    const data = {
      transactions: [tx({ category: "Pets" }), tx({ category: "Pets", type: "income" })],
      recurring: [],
      budgets: [{ id: "b", category: "Pets", amount: 500 }],
      categories: custom,
    };
    const renamed = renameCategory(data, "c1", "Dog");
    expect(renamed.transactions.map((t) => t.category)).toEqual(["Dog", "Pets"]);
    expect(renamed.budgets[0].category).toBe("Dog");
    expect(renamed.categories[0].name).toBe("Dog");
    expect(categoryUsage("Pets", "expense", data)).toBe(1);
  });
});
