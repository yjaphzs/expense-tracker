import {
  UtensilsIcon,
  PlaneIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  PopcornIcon,
  HeartPulseIcon,
  GraduationCapIcon,
  CircleEllipsisIcon,
  BriefcaseIcon,
  WalletIcon,
  LaptopIcon,
  TrendingUpIcon,
  GiftIcon,
  ArrowLeftRightIcon,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Expense categories
  Food: UtensilsIcon,
  Travel: PlaneIcon,
  Bills: ReceiptIcon,
  Shopping: ShoppingBagIcon,
  Entertainment: PopcornIcon,
  Health: HeartPulseIcon,
  Education: GraduationCapIcon,
  // Income categories
  Salary: BriefcaseIcon,
  Allowance: WalletIcon,
  Freelance: LaptopIcon,
  Investment: TrendingUpIcon,
  Gift: GiftIcon,
  // Transfer
  Transfer: ArrowLeftRightIcon,
  // Fallback
  Other: CircleEllipsisIcon,
};

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? CircleEllipsisIcon;
}
