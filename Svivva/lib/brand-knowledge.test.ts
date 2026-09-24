import { describe, expect, it } from "vitest";
import { getBrandEntityCard, getBrandKnowledge, getBrandProfileSummary } from "./brand-knowledge";
import { getSvivvaProductProfile } from "./orbit/product-profile";
import { homepageJsonLdGraph, organizationSchema } from "./seo/schema/builders";

describe("brand-knowledge (SearchDock / AEO entity)", () => {
  it("exposes aliases so SearchDock can resolve zzai zzai / ZZAI / zzaizzai", () => {
    const k = getBrandKnowledge("https://zzaizzai.com");
    const names = k.aliases.map((a) => a.name);
    expect(names).toEqual(
      expect.arrayContaining(["zzai zzai", "ZZAI", "zzaizzai", "zzaizzai.com", "Svivva"]),
    );
    expect(k.definition.toLowerCase()).toContain("zzaizzai.com");
    expect(k.definition).toMatch(/From seed to symphony/);
  });

  it("maps the six cube faces and core products", () => {
    const k = getBrandKnowledge("https://zzaizzai.com");
    expect(k.cubeFaces).toHaveLength(6);
    expect(k.products.some((p) => p.id === "api")).toBe(true);
    expect(k.products.some((p) => p.id === "orbit")).toBe(true);
    expect(k.products.some((p) => p.id === "protect")).toBe(true);
    expect(k.citationUrls.some((u) => u.path === "/llms.txt")).toBe(true);
    expect(k.faqs.length).toBeGreaterThanOrEqual(6);
  });

  it("builds a Schema.org organization card with alternateName", () => {
    const card = getBrandEntityCard("https://zzaizzai.com");
    expect(card["@type"]).toBe("Organization");
    expect(card.name).toBe("zzai zzai");
    expect(card.alternateName).toEqual(expect.arrayContaining(["ZZAI", "zzaizzai"]));
    expect(card.url).toBe("https://zzaizzai.com");
  });

  it("feeds Orbit product profile with full platform context", () => {
    const p = getSvivvaProductProfile();
    expect(p.name).toBe("zzai zzai");
    expect(p.aliases).toEqual(expect.arrayContaining(["zzaizzai", "ZZAI"]));
    expect(p.definition).toMatch(/OaaS|cube|Seeds/i);
    expect(p.products.length).toBeGreaterThan(5);
    expect(p.cubeFaces).toHaveLength(6);
    expect(p.pricing).toMatch(/\$49/);
  });

  it("summary matches knowledge for directory / SearchDock fills", () => {
    const s = getBrandProfileSummary("https://zzaizzai.com");
    expect(s.toolsHubUrl).toBe("https://zzaizzai.com/ai-tools-hub");
    expect(s.category.toLowerCase()).toContain("ai");
  });

  it("homepage JSON-LD graph includes Organization + FAQ + SoftwareApplication", () => {
    const graph = homepageJsonLdGraph();
    const types = graph.map((g) => (g as { "@type"?: string })["@type"]);
    expect(types).toEqual(
      expect.arrayContaining([
        "Organization",
        "WebSite",
        "SoftwareApplication",
        "FAQPage",
        "HowTo",
      ]),
    );
    const org = organizationSchema();
    expect(org.alternateName).toEqual(expect.arrayContaining(["zzai zzai", "ZZAI"]));
    expect(org.description).toMatch(/zzaizzai\.com/);
  });

  it("indexes Klean Sneaks and ZZAI Show events as citation products", () => {
    const k = getBrandKnowledge("https://zzaizzai.com");
    expect(k.products.some((p) => p.path === "/clean-sneaks")).toBe(true);
    expect(k.products.some((p) => p.path === "/events")).toBe(true);
    expect(k.citationUrls.some((u) => u.path === "/clean-sneaks")).toBe(true);
    expect(k.citationUrls.some((u) => u.path === "/events")).toBe(true);
    expect(k.faqs.some((f) => /Klean Sneaks/i.test(f.q))).toBe(true);
  });
});
