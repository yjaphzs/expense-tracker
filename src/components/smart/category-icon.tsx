"use client";

import { createElement } from "react";
import type { LucideProps } from "lucide-react";

import { useCategoryIcon } from "@/context/tracker-context";

/** A category's icon (built-in or custom). Looked up by name, so it follows renames. */
export function CategoryIcon({ name, ...props }: LucideProps & { name: string }) {
  const iconFor = useCategoryIcon();
  return createElement(iconFor(name), props);
}
