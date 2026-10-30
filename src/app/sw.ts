/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Injected at build time — the list of precached build assets.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Firebase Auth, Firestore, Storage and Cloud Functions use their own transport
// (WebSockets / gRPC-web) and manage their own offline persistence. The service
// worker must never cache or intercept these — let them go straight to network.
const FIREBASE_ORIGINS = [
  "firebaseapp.com",
  "googleapis.com",
  "gstatic.com",
  "firebaseio.com",
  "firebasestorage.app",
  "cloudfunctions.net",
];

// Cache on use: precache only the app shell ("/", added in next.config.ts).
// The build's ~70 JS/CSS/font files are NOT downloaded up front (that cost
// every first-time visitor about 1.5 MB of Hosting transfer); defaultCache
// stores each one the first time it's used, and PwaRegister hands over the
// files the first page already loaded, so offline still works after one visit.
const shellOnly = (self.__SW_MANIFEST ?? []).filter(
  (entry) => (typeof entry === "string" ? entry : entry.url) === "/",
);

const serwist = new Serwist({
  precacheEntries: shellOnly,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) =>
        FIREBASE_ORIGINS.some((origin) => url.hostname.endsWith(origin)),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  // When a navigation can't be served (offline, and the route wasn't cached),
  // fall back to the precached app shell ("/"). The app is a client-rendered
  // SPA, so the shell boots and the router takes over from there.
  fallbacks: {
    entries: [
      {
        url: "/",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
