import { describe, expect, it } from "vitest";
import {
  analyzeReferenceSignals,
  buildReferenceUiTheme,
  hashTextToSeed,
  nearestColorwayId,
  paletteFromTextReference,
  rankUiOptionsForReference,
  referenceUiThemeToCssVars,
  retargetUiOption,
} from "./reference-ui-theme";
import { KLEAN_UI_OPTIONS } from "./ui-options-catalog";
import type { ColorSwatch } from "@/lib/poor-man-protection/types";

describe("reference-ui-theme", () => {
  it("seeds a stable text palette", () => {
    const a = paletteFromTextReference("neon tokyo rain");
    const b = paletteFromTextReference("neon tokyo rain");
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
    expect(a[0]?.role).toBe("dominant");
    expect(a.every((s) => /^#[0-9a-f]{6}$/i.test(s.hex))).toBe(true);
  });

  it("changes seed when reference text changes", () => {
    expect(hashTextToSeed("alpha")).not.toBe(hashTextToSeed("beta"));
  });

  it("maps emerald-leaning palette to emerald colorway", () => {
    const palette: ColorSwatch[] = [
      { hex: "#0d3b2e", role: "dominant", weight: 0.4 },
      { hex: "#1a5c45", role: "secondary", weight: 0.2 },
      { hex: "#2ecc71", role: "accent", weight: 0.2 },
      { hex: "#061a14", role: "shadow", weight: 0.1 },
      { hex: "#a8ffce", role: "highlight", weight: 0.1 },
    ];
    expect(nearestColorwayId(palette)).toBe("emerald");
  });

  it("exposes a multitude of strategic UI options", () => {
    expect(KLEAN_UI_OPTIONS.length).toBeGreaterThanOrEqual(12);
  });

  it("ranks neon night references toward neon/arcade chrome", () => {
    const palette = paletteFromTextReference("neon tokyo night rain cyber club");
    const { ranked, signals } = rankUiOptionsForReference({
      referenceText: "neon tokyo night rain cyber club",
      palette,
    });
    expect(signals.luminance).toBe("dark");
    expect(ranked[0]?.id).toMatch(/neon|arcade|street|vapor/);
    expect(ranked).toHaveLength(KLEAN_UI_OPTIONS.length);
  });

  it("keeps exact palette when retargeting UI option", () => {
    const palette = paletteFromTextReference("court docket seal evidence");
    const theme = buildReferenceUiTheme({
      referenceText: "court docket seal evidence",
      palette,
      contentHash: "b".repeat(64),
    });
    expect(theme.version).toBe(2);
    expect(theme.uiOptionId).toBeTruthy();
    const retargeted = retargetUiOption(theme, "glass-minimal");
    expect(retargeted.palette).toEqual(theme.palette);
    expect(retargeted.colors).toEqual(theme.colors);
    expect(retargeted.uiOptionId).toBe("glass-minimal");
    expect(retargeted.name).toMatch(/Glass Minimal/i);
  });

  it("builds CSS vars including layout tokens", () => {
    const palette = paletteFromTextReference("solar flare court pack");
    const theme = buildReferenceUiTheme({
      referenceText: "solar flare court pack",
      palette,
      contentHash: "a".repeat(64),
    });
    expect(theme.version).toBe(2);
    expect(theme.rankedUiOptions.length).toBe(KLEAN_UI_OPTIONS.length);
    const vars = referenceUiThemeToCssVars(theme);
    expect(vars["--klean-accent"]).toMatch(/^#/);
    expect(vars["--klean-bg-deep"]).toMatch(/^#/);
    expect(vars["--klean-hud"]).toBeTruthy();
    expect(vars["--klean-radius"]).toBeTruthy();
  });

  it("analyzes light pastel signals", () => {
    const palette: ColorSwatch[] = [
      { hex: "#f7e7f0", role: "dominant", weight: 0.4 },
      { hex: "#ffe8f4", role: "secondary", weight: 0.2 },
      { hex: "#ff9ec8", role: "accent", weight: 0.2 },
      { hex: "#e8d0dc", role: "shadow", weight: 0.1 },
      { hex: "#ffffff", role: "highlight", weight: 0.1 },
    ];
    const signals = analyzeReferenceSignals(palette);
    expect(signals.luminance).toBe("light");
  });
});
