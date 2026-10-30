"use client";

import { useEffect } from "react";

const SW_PATH = "/sw.js";

/**
 * Registers the PWA service worker and, on first load after the Vite→Next.js
 * migration, unregisters any legacy Vite service workers and clears their caches.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        const hasCurrentSW = registrations.some((r) =>
          [r.active, r.installing, r.waiting].some((w) =>
            w?.scriptURL.endsWith(SW_PATH)
          )
        );

        if (!hasCurrentSW && registrations.length > 0) {
          // Legacy Vite PWA service workers exist — unregister and clear their caches
          registrations.forEach((r) => r.unregister());
          if ("caches" in window) {
            caches
              .keys()
              .then((keys) => keys.forEach((key) => caches.delete(key)))
              .catch(() => undefined);
          }
        }
      })
      .catch(() => undefined);

    // The worker is only generated in the production build (Serwist is disabled
    // in dev), so only register there to avoid a 404 on /sw.js.
    if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
      navigator.serviceWorker
        .register(SW_PATH)
        .then(() => navigator.serviceWorker.ready)
        .then((registration) => {
          // The worker only precaches the app shell. Give it the scripts,
          // styles and fonts this page already loaded so the app opens
          // offline next time; they come from the browser cache, so this
          // doesn't download anything again.
          const urlsToCache = performance
            .getEntriesByType("resource")
            .map((entry) => entry.name)
            .filter((url) => url.startsWith(`${location.origin}/_next/static/`));
          registration.active?.postMessage({ type: "CACHE_URLS", payload: { urlsToCache } });
        })
        .catch(() => undefined);
    }
  }, []);

  return null;
}
