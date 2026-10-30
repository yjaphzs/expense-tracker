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
    version: "2.2.0",
    date: "October 31, 2026",
    title: "Budgets, search, and reports",
    changes: [
      { type: "new", text: "Monthly budgets for all spending or per category, with progress on Home and a heads-up at 80% and 100%." },
      { type: "new", text: "Search and filter transactions by category, wallet, and date." },
      { type: "new", text: "Add your own categories, each with its own icon." },
      { type: "new", text: "A printable Summary Report: print it or save it as a PDF." },
      { type: "new", text: "Export and import CSV files, with a preview before anything is added." },
      { type: "new", text: "Recurring items can end on a date, and “Coming up” shows what’s due this week." },
      { type: "new", text: "Edit a transfer: both sides update together, and you can set its date." },
      { type: "new", text: "A quick setup for new users: pick your wallets in one tap." },
      { type: "new", text: "Install the app from the banner, or use Add to Home Screen on iPhone." },
      { type: "improved", text: "A new look for the Excel export: a summary sheet, real dates, peso amounts, wallets, and budgets." },
      { type: "improved", text: "Forms remember the wallet and category you used last." },
      { type: "improved", text: "Rename wallets, change their type, and put them in the order you like." },
      { type: "improved", text: "On phones, notifications appear at the top of the screen, away from the buttons." },
      { type: "improved", text: "The account menu shows whether your changes are saved, saving, or waiting for a connection." },
      { type: "improved", text: "The app version now sits in the footer." },
      { type: "improved", text: "Friendlier pages for broken links and unexpected errors." },
      { type: "fixed", text: "Daily recurring items no longer add the same transaction many times in time zones ahead of UTC, such as the Philippines." },
      { type: "fixed", text: "Weekly and monthly recurring items now land on the right dates." },
      { type: "fixed", text: "With Autosave off, quick back-to-back changes are no longer lost." },
    ],
  },
  {
    version: "2.1.0",
    date: "October 31, 2026",
    title: "Made for phones",
    changes: [
      { type: "new", text: "A bottom tab bar on phones to move between Home, Income, Expenses, Recurring, and Analytics." },
      { type: "new", text: "A floating Add button that adds to whichever section you're on." },
      { type: "new", text: "Tap any transaction or recurring item to see its details and edit, pause, or delete it." },
      { type: "new", text: "Undo right after you delete a transaction." },
      { type: "improved", text: "Forms and menus open as bottom sheets on phones, with bigger buttons that are easier to tap." },
      { type: "improved", text: "Amounts show the peso sign (₱), and amount fields open the number keypad." },
      { type: "improved", text: "Analytics fits small screens, with a view picker and shorter chart labels." },
      { type: "improved", text: "A short confirmation when you add, edit, or delete something." },
      { type: "improved", text: "The section you're on stays open when you refresh the page." },
      { type: "improved", text: "Faster first load: charts, Excel export, and QR Transfer load only when you use them." },
      { type: "fixed", text: "Deleting one side of a wallet transfer now removes both sides." },
      { type: "fixed", text: "Transfers can't be edited one side at a time anymore, which used to split them. To change one, delete it and make a new transfer." },
      { type: "fixed", text: "Your latest change is saved even if you close the app right after making it." },
      { type: "fixed", text: "You now get a message if a change couldn't be saved to your account." },
    ],
  },
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
