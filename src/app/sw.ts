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

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
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
});

serwist.addEventListeners();
