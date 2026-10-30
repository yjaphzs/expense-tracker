import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

import pkg from "./package.json";

// Static export is only enabled for production builds — `npm run dev` runs as a
// normal Next.js app. The whole app is client-rendered (the calculator and the
// Firebase auth flows are browser-only), so a static export to `out/` deploys
// cleanly to Firebase Hosting.
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  ...(isProd ? { output: "export" as const } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    // Exposed to the client as process.env.NEXT_PUBLIC_APP_VERSION so the
    // header can show the running version without a separate env var.
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

const withSerwist = withSerwistInit({
  // Source worker (TypeScript) and the generated output served from /sw.js.
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // We register the worker ourselves in <PwaRegister> so we can also clean up
  // legacy Vite service workers on the way in.
  register: false,
  // No service worker in development — only in the production static export.
  disable: !isProd,
  // Cache on use (see src/app/sw.ts): no extra page fetches on client-side
  // navigation, and no forced reload when the connection comes back (that
  // re-downloaded the page and could interrupt someone mid-edit).
  cacheOnNavigation: false,
  reloadOnOnline: false,
  // With `output: 'export'`, Serwist's precache manifest is built before Next
  // emits the static HTML, so no page ends up precached and the app can't open
  // offline. Explicitly precache the app shell ("/") here — the worker fetches
  // it during install (while online) and serves it as the offline fallback for
  // every navigation. The version is the cache-buster: bump it on each release
  // (it already drives the changelog) so the shell refreshes for offline users.
  additionalPrecacheEntries: [{ url: "/", revision: pkg.version }],
});

export default withSerwist(nextConfig);
