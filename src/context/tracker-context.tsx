"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { SECTION_VALUES, type Section } from "@/config/sections";
import { useDataActions } from "@/hooks/use-data-actions";
import { useEntryActions } from "@/hooks/use-entry-actions";
import { useSetupActions } from "@/hooks/use-setup-actions";
import { useTrackerData } from "@/hooks/use-tracker-data";
import { useTrackerDialogs } from "@/hooks/use-tracker-dialogs";
import { useUrlTab } from "@/hooks/use-url-tab";
import { getCategoryIcon } from "@/lib/category-icons";

function useTrackerValue() {
  const data = useTrackerData();
  const dialogs = useTrackerDialogs();
  const [section, setSection] = useUrlTab<Section>(SECTION_VALUES, "home");
  const actions = {
    ...useEntryActions(data, dialogs, section),
    ...useDataActions(data),
    ...useSetupActions(data),
  };
  return { data, dialogs, actions, section, setSection };
}

export type Tracker = ReturnType<typeof useTrackerValue>;

const TrackerContext = createContext<Tracker | null>(null);

/** Everything the tracker page and its sections share: data, open overlays, actions, the current section. */
export function TrackerProvider({ children }: { children: ReactNode }) {
  const value = useTrackerValue();
  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker(): Tracker {
  const tracker = useContext(TrackerContext);
  if (!tracker) throw new Error("useTracker must be used inside <TrackerProvider>");
  return tracker;
}

/** Icon lookup that knows the user's custom categories. */
export function useCategoryIcon() {
  const categories = useContext(TrackerContext)?.data.categories;
  return useMemo(() => (name: string) => getCategoryIcon(name, categories ?? []), [categories]);
}
