import { describe, expect, it } from "vitest";
import {
  computeRouteRetryDelay,
  shouldRetryStep,
} from "./route-retry";

describe("computeRouteRetryDelay", () => {
  it("uses exponential backoff from base", () => {
    expect(computeRouteRetryDelay(1, { backoffMs: 1000 })).toBe(1000);
    expect(computeRouteRetryDelay(2, { backoffMs: 1000 })).toBe(2000);
    expect(computeRouteRetryDelay(3, { backoffMs: 500 })).toBe(2000);
  });

  it("defaults base to 1000ms", () => {
    expect(computeRouteRetryDelay(1, {})).toBe(1000);
  });
});

describe("shouldRetryStep", () => {
  it("allows retries below maxAttempts", () => {
    expect(shouldRetryStep(1, { maxAttempts: 3 })).toBe(true);
    expect(shouldRetryStep(2, { maxAttempts: 3 })).toBe(true);
  });

  it("stops at maxAttempts", () => {
    expect(shouldRetryStep(3, { maxAttempts: 3 })).toBe(false);
  });

  it("defaults maxAttempts to 3", () => {
    expect(shouldRetryStep(2, {})).toBe(true);
    expect(shouldRetryStep(3, {})).toBe(false);
  });
});
