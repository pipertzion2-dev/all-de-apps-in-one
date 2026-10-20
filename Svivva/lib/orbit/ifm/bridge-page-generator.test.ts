import { describe, expect, it } from "vitest";
import { buildIfmBridgePageDraft } from "./bridge-page-generator";
import type { IfmPairing } from "./ifm-types";
import { scorePageContent } from "@/lib/seo/content-quality/score";

const samplePairing: IfmPairing = {
  id: "p1",
  toolA: {
    name: "JSON Schema Validator",
    path: "/tools/json-schema-validator",
    url: "https://example.com/tools/json-schema-validator",
    hub: "ai-tools-hub",
    description: "Validate JSON schemas",
  },
  toolB: {
    name: "Password Strength Checker",
    path: "/tools/password-strength",
    url: "https://example.com/tools/password-strength",
    hub: "cyber-security-mini-apps",
    description: "Check password strength",
  },
  fusionTitle: "JSON × Password Bridge",
  slug: "ifm-json-password",
  bridgePrinciple: "Cross-hub intent fusion for builders.",
  microToolIdea: "Chain schema validation into password policy checks.",
  ctaPrimary: { label: "Build on ZZAI", href: "https://example.com/dashboard" },
  ctaSecondary: { label: "Open validator", href: "https://example.com/tools/json-schema-validator" },
  faq: [
    { question: "What is this?", answer: "A fused bridge page for adjacent intents." },
    { question: "Is it free?", answer: "Yes, the micro-utility is free." },
  ],
  status: "planned",
  createdAt: new Date().toISOString(),
};

describe("buildIfmBridgePageDraft", () => {
  it("produces SEO fields and FAQ schema", () => {
    const draft = buildIfmBridgePageDraft(samplePairing);
    expect(draft.slug).toBeTruthy();
    expect(draft.content).toContain("FAQPage");
    expect(draft.category).toBe("ifm-bridge");
    expect(draft.relatedSlugs.length).toBe(2);
  });

  it("passes content quality gate", () => {
    const draft = buildIfmBridgePageDraft(samplePairing);
    const quality = scorePageContent({
      title: draft.title,
      content: draft.content,
      benefits: draft.benefits,
      howItWorks: draft.howItWorks,
      whoItsFor: draft.whoItsFor,
      hasFaq: true,
      relatedCount: draft.relatedSlugs.length,
    });
    expect(quality.passed).toBe(true);
  });
});
