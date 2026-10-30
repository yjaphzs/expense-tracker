"use client";

import { toast } from "sonner";

import type { TrackerData } from "@/hooks/use-tracker-data";
import { categoryUsage, renameCategory } from "@/lib/categories";
import type { Budget, CustomCategory, TransactionType, Wallet, WalletType } from "@/types/transaction";

/** Wallets, custom categories and budgets: the things users set up once and adjust. */
export function useSetupActions(data: TrackerData) {
  const addWallet = (name: string, type: WalletType) => {
    data.addWallet(name, type);
    toast.success(`Wallet "${name.trim()}" added`);
  };

  const editWallet = (id: string, changes: Pick<Wallet, "name" | "type">) => {
    data.editWallet(id, changes);
    toast.success("Wallet updated");
  };

  const removeWallet = (id: string) => {
    data.removeWallet(id);
    toast.success("Wallet deleted");
  };

  const addCategory = (name: string, type: TransactionType, icon: string): CustomCategory => {
    const category: CustomCategory = { id: crypto.randomUUID(), name: name.trim(), type, icon };
    data.setCategories((prev) => [...prev, category]);
    toast.success(`Category "${category.name}" added`);
    return category;
  };

  /** Renames everywhere it's used (transactions, recurring items, its budget). */
  const editCategory = (id: string, name: string, icon: string) => {
    const target = data.categories.find((c) => c.id === id);
    if (!target) return;
    if (target.name !== name.trim()) {
      const next = renameCategory(data, id, name);
      data.setTransactions(next.transactions);
      data.setRecurring(next.recurring);
      data.setBudgets(next.budgets);
      data.setCategories(next.categories.map((c) => (c.id === id ? { ...c, icon } : c)));
    } else {
      data.setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, icon } : c)));
    }
    toast.success("Category updated");
  };

  /** Only unused categories can be deleted; their budget goes with them. */
  const removeCategory = (id: string) => {
    const target = data.categories.find((c) => c.id === id);
    if (!target || categoryUsage(target.name, target.type, data) > 0) return;
    data.setCategories((prev) => prev.filter((c) => c.id !== id));
    if (target.type === "expense") data.setBudgets((prev) => prev.filter((b) => b.category !== target.name));
    toast.success("Category deleted");
  };

  const saveBudgets = (budgets: Budget[]) => {
    data.setBudgets(budgets);
    toast.success(budgets.length ? "Budgets saved" : "Budgets cleared");
  };

  return { addWallet, editWallet, removeWallet, addCategory, editCategory, removeCategory, saveBudgets };
}

export type SetupActions = ReturnType<typeof useSetupActions>;
