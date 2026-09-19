import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("indexnow submit route", () => {
  it("honors internal scheduler secret via request headers", () => {
    const src = readFileSync(resolve(__dirname, "../../app/api/indexnow/submit/route.ts"), "utf8");
    expect(src).toContain("isOrbitAdminAllowed(req)");
    expect(src).not.toMatch(/isOrbitAdminAllowed\(\)\s*\)/);
  });
});
