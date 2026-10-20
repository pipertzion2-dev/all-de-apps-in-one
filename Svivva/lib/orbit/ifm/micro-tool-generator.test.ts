import { describe, expect, it } from "vitest";
import {
  buildIfmMicroToolHtml,
  bridgeContentHasMicroTool,
  injectMicroToolIntoBridgeContent,
} from "./micro-tool-generator";
import type { IfmPairing } from "./ifm-types";

const pairing: IfmPairing = {
  id: "pair-1",
  toolA: {
    name: "Tool A",
    path: "/tools/a",
    url: "https://example.com/tools/a",
    hub: "ai-tools-hub",
    description: "A tool",
  },
  toolB: {
    name: "Tool B",
    path: "/tools/b",
    url: "https://example.com/tools/b",
    hub: "cyber-security-mini-apps",
    description: "B tool",
  },
  fusionTitle: "A × B Bridge",
  slug: "ifm-a-b",
  bridgePrinciple: "Fuse intents",
  microToolIdea: "Chain A into B",
  ctaPrimary: { label: "Build", href: "/dashboard" },
  ctaSecondary: { label: "Open A", href: "/tools/a" },
  faq: [],
  status: "generated",
  createdAt: new Date().toISOString(),
};

describe("micro-tool-generator", () => {
  it("builds interactive fusion widget HTML", () => {
    const html = buildIfmMicroToolHtml(pairing);
    expect(html).toContain('id="ifm-micro-tool"');
    expect(html).toContain("Tool A");
    expect(html).toContain("textarea");
  });

  it("injects micro-tool block into bridge content", () => {
    const base = "<h1>Title</h1><h2>Micro-tool concept</h2><p>Idea</p>";
    const merged = injectMicroToolIntoBridgeContent(base, pairing);
    expect(bridgeContentHasMicroTool(merged)).toBe(true);
    expect(merged.indexOf("ifm-micro-tool")).toBeLessThan(merged.indexOf("Micro-tool concept"));
  });
});
