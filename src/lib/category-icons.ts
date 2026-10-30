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
  BabyIcon,
  BikeIcon,
  BookOpenIcon,
  BusIcon,
  CarIcon,
  CoffeeIcon,
  DumbbellIcon,
  FuelIcon,
  GamepadIcon,
  HandCoinsIcon,
  HomeIcon,
  LightbulbIcon,
  MusicIcon,
  PawPrintIcon,
  PiggyBankIcon,
  PillIcon,
  ScissorsIcon,
  ShirtIcon,
  SmartphoneIcon,
  StoreIcon,
  TvIcon,
  WifiIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";

import type { CustomCategory } from "@/types/transaction";

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

/** Icons a custom category can use, by the key stored on the category. */
export const CATEGORY_ICON_CHOICES: Record<string, LucideIcon> = {
  coffee: CoffeeIcon,
  store: StoreIcon,
  home: HomeIcon,
  bulb: LightbulbIcon,
  wifi: WifiIcon,
  phone: SmartphoneIcon,
  car: CarIcon,
  fuel: FuelIcon,
  bus: BusIcon,
  bike: BikeIcon,
  pill: PillIcon,
  gym: DumbbellIcon,
  shirt: ShirtIcon,
  scissors: ScissorsIcon,
  baby: BabyIcon,
  pet: PawPrintIcon,
  book: BookOpenIcon,
  game: GamepadIcon,
  music: MusicIcon,
  tv: TvIcon,
  tools: WrenchIcon,
  savings: PiggyBankIcon,
  coins: HandCoinsIcon,
  other: CircleEllipsisIcon,
};

export const DEFAULT_CATEGORY_ICON = "other";

/** The icon for a category name: custom categories first, then the built-ins. */
export function getCategoryIcon(category: string, custom: CustomCategory[] = []): LucideIcon {
  const mine = custom.find((c) => c.name === category);
  if (mine) return CATEGORY_ICON_CHOICES[mine.icon] ?? CircleEllipsisIcon;
  return CATEGORY_ICONS[category] ?? CircleEllipsisIcon;
}
