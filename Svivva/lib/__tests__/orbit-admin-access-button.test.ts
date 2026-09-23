import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("OrbitAdminAccessButton", () => {
  it("routes to admin unlock then dashboard orbit without embedding passcodes", () => {
    const src = readFileSync(resolve(__dirname, "../../components/orbit-admin-access-button.tsx"), "utf8");
    expect(src).toContain("/dashboard/orbit");
    expect(src).toContain("/admin?redirect=");
    expect(src).not.toContain("2424");
    expect(src).not.toContain("272727");
  });
});
