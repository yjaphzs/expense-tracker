"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A tab value mirrored to `?tab=` so a refresh or shared link reopens the same
 * section. Uses the History API directly (replaceState: switching sections
 * doesn't stack Back entries), which avoids the Suspense boundary that
 * `useSearchParams` needs in a static export. The default tab keeps a clean URL.
 */
export function useUrlTab<T extends string>(tabs: readonly T[], fallback: T): [T, (next: T) => void] {
  const [tab, setTab] = useState<T>(fallback);

  // Read the starting tab after mount (the static HTML always renders the default).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested && (tabs as readonly string[]).includes(requested)) setTab(requested as T);
    // tabs is a constant list; read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = useCallback(
    (next: T) => {
      setTab(next);
      const url = new URL(window.location.href);
      if (next === fallback) url.searchParams.delete("tab");
      else url.searchParams.set("tab", next);
      window.history.replaceState(window.history.state, "", url);
    },
    [fallback],
  );

  return [tab, select];
}
