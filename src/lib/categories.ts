import type {
  Budget,
  CustomCategory,
  RecurringTransaction,
  Transaction,
  TransactionType,
} from "@/types/transaction";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, TRANSFER_CATEGORY } from "@/types/transaction";

export const MAX_CATEGORY_NAME = 24;

export function builtInCategories(type: TransactionType): readonly string[] {
  return type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}

/** The categories offered for a type: built-ins, then custom ones A–Z, with "Other" last. */
export function categoryNames(type: TransactionType, custom: CustomCategory[]): string[] {
  const builtIns = builtInCategories(type).filter((name) => name !== "Other");
  const mine = custom
    .filter((c) => c.type === type)
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b));
  return [...builtIns, ...mine, "Other"];
}

/** Why a name can't be used (empty, too long, or taken for this type), or null if it's fine. */
export function validateCategoryName(
  name: string,
  type: TransactionType,
  custom: CustomCategory[],
  excludeId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Enter a name.";
  if (trimmed.length > MAX_CATEGORY_NAME) return `Use ${MAX_CATEGORY_NAME} characters or fewer.`;
  const lower = trimmed.toLowerCase();
  const taken =
    lower === TRANSFER_CATEGORY.toLowerCase() ||
    builtInCategories(type).some((c) => c.toLowerCase() === lower) ||
    custom.some((c) => c.type === type && c.id !== excludeId && c.name.toLowerCase() === lower);
  return taken ? "That category already exists." : null;
}

interface CategoryData {
  transactions: Transaction[];
  recurring: RecurringTransaction[];
  budgets: Budget[];
  categories: CustomCategory[];
}

/** How many transactions and recurring items use a category of this type. */
export function categoryUsage(name: string, type: TransactionType, data: Pick<CategoryData, "transactions" | "recurring">) {
  const match = (item: { category: string; type: TransactionType }) => item.category === name && item.type === type;
  return data.transactions.filter(match).length + data.recurring.filter(match).length;
}

/**
 * Renames a custom category and everything filed under it (transactions,
 * recurring items, and its budget for expense categories).
 */
export function renameCategory(data: CategoryData, id: string, newName: string): CategoryData {
  const target = data.categories.find((c) => c.id === id);
  if (!target) return data;
  const name = newName.trim();
  const rename = <T extends { category: string; type: TransactionType }>(item: T): T =>
    item.category === target.name && item.type === target.type ? { ...item, category: name } : item;
  return {
    transactions: data.transactions.map(rename),
    recurring: data.recurring.map(rename),
    budgets:
      target.type === "expense"
        ? data.budgets.map((b) => (b.category === target.name ? { ...b, category: name } : b))
        : data.budgets,
    categories: data.categories.map((c) => (c.id === id ? { ...c, name } : c)),
  };
}
