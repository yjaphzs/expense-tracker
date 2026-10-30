import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests cover pure logic only (date math, state merging, import
// validation, filters, budgets, CSV, export and report builders): no DOM, no
// Firebase. Test files sit next to the module they cover as `*.test.ts`.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Most users are in the Philippines (UTC+8), where UTC-based date code breaks.
    env: { TZ: "Asia/Manila" },
  },
});
