import { ChartPieIcon, HomeIcon, RepeatIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import type { BottomTab } from "@/components/shared/bottom-tab-bar";

/** The tracker's sections: top tabs on desktop, the bottom tab bar on phones, `?tab=` in the URL. */
export type Section = "home" | "income" | "expenses" | "recurring" | "analytics";

export const SECTIONS: BottomTab<Section>[] = [
  { value: "home", label: "Home", icon: HomeIcon },
  { value: "income", label: "Income", icon: TrendingUpIcon },
  { value: "expenses", label: "Expenses", icon: TrendingDownIcon },
  { value: "recurring", label: "Recurring", icon: RepeatIcon },
  { value: "analytics", label: "Analytics", icon: ChartPieIcon },
];

export const SECTION_VALUES = SECTIONS.map((section) => section.value);
