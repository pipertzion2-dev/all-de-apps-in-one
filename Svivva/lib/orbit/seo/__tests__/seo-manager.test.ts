import { describe, expect, it } from "vitest";
import { slugifyMiniAppName, isValidPublicAppSlug, publicAppPath } from "../slug";
import { defaultSeoMetadata } from "../metadata-defaults";
import { canPublish, runPrePublishSeoChecks } from "../pre-publish-checks";
import { encryptSecret, decryptSecret } from "../secrets";
import { isRobotsDisallowed } from "@/lib/seo/robots-config";

describe("Orbit SEO slug + metadata", () => {
  it("slugifies names and builds /apps paths", () => {
    expect(slugifyMiniAppName("Invoice Generator!")).toBe("invoice-generator");
    expect(publicAppPath("invoice-generator")).toBe("/apps/invoice-generator");
    expect(isValidPublicAppSlug("invoice-generator")).toBe(true);
    expect(isValidPublicAppSlug("Bad Slug")).toBe(false);
  });

  it("never blocks /apps/ in robots policy", () => {
    expect(isRobotsDisallowed("/apps")).toBe(false);
    expect(isRobotsDisallowed("/apps/invoice-generator")).toBe(false);
    expect(isRobotsDisallowed("/dashboard/orbit/seo")).toBe(true);
  });

  it("generates self-referencing defaults", () => {
    const m = defaultSeoMetadata(
      {
        name: "Invoice Generator",
        description: "Create simple invoices in your browser for freelancers and small teams.",
        category: "productivity",
        slug: "invoice-generator",
      },
      "https://zzaizzai.com",
    );
    expect(m.canonicalUrl).toBe("https://zzaizzai.com/apps/invoice-generator");
    expect(m.seoTitle).toMatch(/Invoice Generator/);
    expect(m.crawlableBody.length).toBeGreaterThan(80);
    expect(m.faqJson.length).toBeGreaterThan(0);
  });

  it("blocks publish on critical SEO failures", () => {
    const bad = runPrePublishSeoChecks({
      slug: "Bad",
      origin: "https://zzaizzai.com",
    });
    expect(canPublish(bad)).toBe(false);

    const good = runPrePublishSeoChecks({
      slug: "invoice-generator",
      seoTitle: "Invoice Generator — free online tool | ZZAI",
      metaDescription:
        "Create simple invoices in your browser for freelancers and small teams without installs.",
      canonicalUrl: "https://zzaizzai.com/apps/invoice-generator",
      robotsDirective: "index,follow",
      crawlableBody:
        "Invoice Generator is a public ZZAI mini-app. Create invoices quickly. Category: productivity. This page includes both a clear explanation and the live interactive tool.",
      whoItsFor: "Freelancers and small teams",
      howToUse: "Open the tool and fill in line items.",
      origin: "https://zzaizzai.com",
    });
    expect(canPublish(good)).toBe(true);
  });

  it("encrypts secrets round-trip", () => {
    const enc = encryptSecret("refresh-token-value");
    expect(enc.startsWith("v1:")).toBe(true);
    expect(decryptSecret(enc)).toBe("refresh-token-value");
  });
});
