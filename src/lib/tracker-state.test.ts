import { describe, expect, it } from "vitest";

import type { TrackerState } from "@/types";
import { defaultGuestState, emptyState, hasData, mergeStates, normalizeState, sameState } from "./tracker-state";

const tx = (id: string, amount = 10) => ({
  id,
  type: "expense" as const,
  category: "Food",
  amount,
  description: "",
  date: "2026-01-01",
  walletId: "cash",
});

describe("normalizeState", () => {
  it("fills arrays that older saves don't have", () => {
    const old = { transactions: [tx("a")], recurring: [], wallets: [], autosave: false };
    const state = normalizeState(old);
    expect(state.budgets).toEqual([]);
    expect(state.categories).toEqual([]);
    expect(state.autosave).toBe(false);
    expect(state.transactions).toHaveLength(1);
  });

  it("ignores wrong types and unknown fields", () => {
    const state = normalizeState({ transactions: "nope", extra: 1 });
    expect(state).toEqual(emptyState());
  });
});

describe("hasData", () => {
  it("doesn't count a lone default Cash wallet", () => {
    expect(hasData(defaultGuestState())).toBe(false);
  });

  it("counts budgets and custom categories", () => {
    expect(hasData({ ...emptyState(), budgets: [{ id: "all", amount: 5000 }] })).toBe(true);
    expect(hasData({ ...emptyState(), categories: [{ id: "c", name: "Pets", type: "expense", icon: "paw" }] })).toBe(
      true,
    );
  });
});

describe("mergeStates", () => {
  it("unions every array by id, local winning, and keeps the account's autosave", () => {
    const local: TrackerState = {
      ...emptyState(),
      transactions: [tx("a", 99), tx("b")],
      budgets: [{ id: "food", category: "Food", amount: 3000 }],
      autosave: false,
    };
    const cloud: TrackerState = {
      ...emptyState(),
      transactions: [tx("a", 1), tx("c")],
      categories: [{ id: "c1", name: "Pets", type: "expense", icon: "paw" }],
      autosave: true,
    };
    const merged = mergeStates(local, cloud);
    expect(merged.transactions.map((t) => [t.id, t.amount])).toEqual([
      ["a", 99],
      ["c", 10],
      ["b", 10],
    ]);
    expect(merged.budgets).toHaveLength(1);
    expect(merged.categories).toHaveLength(1);
    expect(merged.autosave).toBe(true);
  });

  it("treats states with equal arrays as the same", () => {
    expect(sameState({ ...emptyState(), autosave: false }, emptyState())).toBe(true);
    expect(sameState(emptyState(), { ...emptyState(), budgets: [{ id: "x", amount: 1 }] })).toBe(false);
  });
});
