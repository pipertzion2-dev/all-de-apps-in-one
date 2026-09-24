import { describe, expect, it } from "vitest";
import {
  DEFAULT_YEAR_SUB_WIN_ODDS,
  YEAR_SUB_PRIZE_DAYS,
  addDays,
  computeProAccessUntil,
  yearSubWinOdds,
} from "@/lib/clean-sneaks/prizes/year-subscription";

describe("year subscription prize helpers", () => {
  it("defaults odds to 5%", () => {
    expect(yearSubWinOdds()).toBe(DEFAULT_YEAR_SUB_WIN_ODDS);
    expect(DEFAULT_YEAR_SUB_WIN_ODDS).toBe(0.05);
  });

  it("extends existing Pro grant instead of resetting", () => {
    const now = new Date("2026-09-24T12:00:00.000Z");
    const existing = new Date("2027-01-01T00:00:00.000Z");
    const until = computeProAccessUntil(existing, now);
    expect(until.getTime()).toBe(addDays(existing, YEAR_SUB_PRIZE_DAYS).getTime());
  });

  it("starts a fresh year from now when no grant exists", () => {
    const now = new Date("2026-09-24T12:00:00.000Z");
    const until = computeProAccessUntil(null, now);
    expect(until.getTime()).toBe(addDays(now, YEAR_SUB_PRIZE_DAYS).getTime());
  });
});
