/**
 * App changelog shown in the "What's new" dialog.
 *
 * Keep entries newest-first. When you ship a release, add an entry at the top
 * with the new `version` (matching package.json) — users who haven't seen that
 * version will get a dot on the "What's new" button until they open it.
 */

export type ChangeType = "new" | "improved" | "fixed";

export interface ChangelogChange {
  type: ChangeType;
  text: string;
}

export interface ChangelogEntry {
  version: string;
  /** Human-readable date, e.g. "June 22, 2026". */
  date: string;
  title?: string;
  changes: ChangelogChange[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.0.0",
    date: "June 22, 2026",
    title: "Accounts & cloud sync",
    changes: [
      { type: "new", text: "Create a free account to save your transactions, wallets, and recurring items." },
      { type: "new", text: "Sync your data automatically across all your devices." },
      { type: "new", text: "Sign in with email and password or with Google." },
      { type: "new", text: "Add a display name and profile photo to your account." },
      { type: "new", text: "This “What's new” changelog, so you never miss an update." },
      { type: "improved", text: "Rebuilt on Next.js for a faster, more reliable experience." },
      { type: "improved", text: "The tracker still works fully offline — no account required." },
    ],
  },
  {
    version: "1.4.0",
    date: "March 2026",
    title: "Weekly breakdown",
    changes: [
      { type: "new", text: "Weekly breakdown view to see how your spending and income trend week over week." },
      { type: "fixed", text: "Empty-state action buttons now lay out correctly on small screens." },
    ],
  },
  {
    version: "1.3.0",
    date: "February 2026",
    title: "Analytics & Excel export",
    changes: [
      { type: "new", text: "Analytics with Overall, Income, and Expense sub-tabs plus category rankings." },
      { type: "new", text: "Interactive bar, donut, area, and wallet-comparison charts with 6 color palettes." },
      { type: "new", text: "Styled Excel export with date-range presets." },
    ],
  },
  {
    version: "1.2.0",
    date: "January 2026",
    title: "Recurring & QR transfer",
    changes: [
      { type: "new", text: "Recurring transactions (daily, weekly, biweekly, monthly) with auto-processing, pause, and resume." },
      { type: "new", text: "QR code transfer to move your data between devices — no server needed." },
      { type: "improved", text: "JSON import/export now validates every field before loading." },
    ],
  },
  {
    version: "1.1.0",
    date: "December 2025",
    title: "Wallets & transfers",
    changes: [
      { type: "new", text: "Multiple wallets (Cash, E-Wallet/Card) with per-wallet balance tracking." },
      { type: "new", text: "Wallet-to-wallet fund transfers." },
    ],
  },
  {
    version: "1.0.0",
    date: "November 2025",
    title: "First release",
    changes: [
      { type: "new", text: "Track income and expenses with categories, wallets, and descriptions." },
      { type: "new", text: "Edit and delete transactions with confirmation dialogs." },
      { type: "new", text: "Autosave to local storage and JSON import/export." },
      { type: "new", text: "Light and dark mode, installable as a Progressive Web App." },
    ],
  },
];

export const LATEST_VERSION = CHANGELOG[0]?.version ?? "0.0.0";
