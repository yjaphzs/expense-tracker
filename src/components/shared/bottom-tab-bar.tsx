"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BottomTab<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

interface BottomTabBarProps<T extends string> {
  tabs: BottomTab<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Phone navigation between the app's sections: a bar fixed to the bottom of
 * the screen, clear of the home indicator. Hidden from md up, where the
 * in-page tabs are used instead.
 */
export function BottomTabBar<T extends string>({ tabs, value, onChange }: BottomTabBarProps<T>) {
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 grid border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map(({ value: tab, label, icon: Icon }) => {
        const active = tab === value;
        return (
          <button
            key={tab}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(tab)}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              active && "text-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                active && "bg-primary/10 text-primary",
              )}
            >
              <Icon aria-hidden className="size-5" />
            </span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
