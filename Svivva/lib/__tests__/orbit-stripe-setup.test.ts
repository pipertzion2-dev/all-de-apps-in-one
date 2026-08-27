import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Orbit admin Stripe setup", () => {
  it("exposes a Stripe tab and setup form on launchpad/orbit", () => {
    const launchpad = readFileSync(
      resolve(__dirname, "../../app/dashboard/launchpad/page.tsx"),
      "utf8",
    );
    expect(launchpad).toContain('| "stripe"');
    expect(launchpad).toContain('tab === "stripe"');
    expect(launchpad).toContain("OrbitStripeSetup");
    expect(launchpad).toContain("orbit-tab-stripe");
    expect(launchpad).toContain("/dashboard/orbit?tab=stripe");
  });

  it("orbit status reports stripeConnected", () => {
    const status = readFileSync(resolve(__dirname, "../../app/api/orbit/status/route.ts"), "utf8");
    expect(status).toContain("stripeConnected");
    expect(status).toContain("hasStripeConfigured");
    expect(status).toContain("hydratePlatformSecrets");
  });

  it("Stripe setup UI can save and verify keys", () => {
    const ui = readFileSync(resolve(__dirname, "../../components/orbit-stripe-setup.tsx"), "utf8");
    expect(ui).toContain("/api/admin/platform-secrets");
    expect(ui).toContain("/api/orbit/quick-start");
    expect(ui).toContain("orbit-stripe-save");
    expect(ui).toContain("orbit-stripe-verify");
  });
});
