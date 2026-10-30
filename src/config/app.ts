/** Application-wide constants. */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Expense Tracker";
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
/** Public app URL (shown on printed reports); falls back to the current origin in the browser. */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
