import { describe, expect, it } from "vitest";
import {
  isNoindexPath,
  isRobotsDisallowed,
  NOINDEX_PATH_PREFIXES,
  ROBOTS_DISALLOW_PATHS,
} from "./robots-config";

describe("robots-config", () => {
  it("blocks admin and auth routes", () => {
    expect(isRobotsDisallowed("/dashboard/launchpad")).toBe(true);
    expect(isRobotsDisallowed("/marketing-hub/campaigns")).toBe(true);
    expect(isRobotsDisallowed("/login")).toBe(true);
    expect(isRobotsDisallowed("/signup")).toBe(true);
    expect(isRobotsDisallowed("/api/gsc/diagnose")).toBe(true);
  });

  it("allows public marketing routes", () => {
    expect(isRobotsDisallowed("/")).toBe(false);
    expect(isRobotsDisallowed("/blog")).toBe(false);
    expect(isRobotsDisallowed("/tools/json-schema-validator")).toBe(false);
    expect(isRobotsDisallowed("/marketing")).toBe(false);
    expect(isRobotsDisallowed("/orbit")).toBe(false);
  });

  it("marks private routes as noindex", () => {
    for (const prefix of NOINDEX_PATH_PREFIXES) {
      expect(isNoindexPath(prefix)).toBe(true);
      expect(isNoindexPath(`${prefix}/nested`)).toBe(true);
    }
    expect(isNoindexPath("/blog")).toBe(false);
  });

  it("uses wildcard disallow rules for nested paths", () => {
    expect(ROBOTS_DISALLOW_PATHS.some((r) => r.endsWith("/*"))).toBe(true);
  });
});
