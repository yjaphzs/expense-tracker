import { describe, expect, it } from "vitest";

import type { RecurringTransaction } from "@/types/transaction";
import { addInterval, dueDates, isFinished, nextDueDate, toLocalDateStr, upcoming } from "./recurring-schedule";

const item = (over: Partial<RecurringTransaction> = {}): RecurringTransaction => ({
  id: "r1",
  type: "expense",
  category: "Bills",
  amount: 100,
  description: "",
  frequency: "daily",
  startDate: "2026-01-01",
  lastProcessedDate: null,
  enabled: true,
  walletId: "cash",
  ...over,
});

describe("time zone", () => {
  it("runs under UTC+8, where UTC-based date code fails", () => {
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(-480);
  });

  it("formats local dates without shifting to UTC", () => {
    expect(toLocalDateStr(new Date(2026, 0, 1, 0, 30))).toBe("2026-01-01");
  });
});

describe("addInterval", () => {
  it("steps daily, weekly and every two weeks by whole days", () => {
    expect(addInterval("2026-01-01", "daily")).toBe("2026-01-02");
    expect(addInterval("2026-01-01", "weekly")).toBe("2026-01-08");
    expect(addInterval("2026-12-25", "biweekly")).toBe("2027-01-08");
  });

  it("keeps the start day for monthly items, clamped in short months", () => {
    expect(addInterval("2026-01-31", "monthly", 31)).toBe("2026-02-28");
    expect(addInterval("2026-02-28", "monthly", 31)).toBe("2026-03-31");
    expect(addInterval("2028-01-30", "monthly", 30)).toBe("2028-02-29");
    expect(addInterval("2026-12-15", "monthly")).toBe("2027-01-15");
  });
});

describe("dueDates", () => {
  it("adds one transaction per day, never the same date twice", () => {
    expect(dueDates(item({ lastProcessedDate: "2026-01-01" }), "2026-01-04")).toEqual([
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ]);
  });

  it("starts on the start date when nothing has been added yet", () => {
    expect(dueDates(item({ frequency: "weekly" }), "2026-01-15")).toEqual(["2026-01-01", "2026-01-08", "2026-01-15"]);
  });

  it("stops at the end date", () => {
    const ending = item({ lastProcessedDate: "2026-01-01", endDate: "2026-01-03" });
    expect(dueDates(ending, "2026-01-10")).toEqual(["2026-01-02", "2026-01-03"]);
    expect(isFinished({ ...ending, lastProcessedDate: "2026-01-03" })).toBe(true);
  });

  it("caps a long catch-up", () => {
    expect(dueDates(item(), "2027-12-31", 5)).toHaveLength(5);
  });
});

describe("nextDueDate and upcoming", () => {
  it("reports the next date, or null once ended", () => {
    expect(nextDueDate(item({ frequency: "monthly", startDate: "2026-01-31", lastProcessedDate: "2026-02-28" }))).toBe(
      "2026-03-31",
    );
    expect(nextDueDate(item({ lastProcessedDate: "2026-01-05", endDate: "2026-01-05" }))).toBeNull();
  });

  it("lists active items due within the window, soonest first", () => {
    const soon = item({ id: "a", lastProcessedDate: "2026-03-01", frequency: "weekly" });
    const later = item({ id: "b", lastProcessedDate: "2026-02-20", frequency: "monthly", startDate: "2026-01-20" });
    const paused = item({ id: "c", enabled: false, lastProcessedDate: "2026-03-01" });
    const result = upcoming([later, soon, paused], "2026-03-02", 7);
    expect(result.map((entry) => [entry.item.id, entry.date])).toEqual([["a", "2026-03-08"]]);
  });
});
