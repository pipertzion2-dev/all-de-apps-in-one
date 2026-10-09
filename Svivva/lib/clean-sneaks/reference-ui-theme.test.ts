import { describe, expect, it } from "vitest";
import {
  buildReferenceUiTheme,
  hashTextToSeed,
  nearestColorwayId,
  paletteFromTextReference,
  referenceUiThemeToCssVars,
} from "./reference-ui-theme";
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

  it("builds CSS vars and a named theme", () => {
    const palette = paletteFromTextReference("solar flare court pack");
    const theme = buildReferenceUiTheme({
      referenceText: "solar flare court pack",
      palette,
      contentHash: "a".repeat(64),
    });
    expect(theme.version).toBe(1);
    expect(theme.name).toMatch(/solar flare/i);
    expect(theme.nearestColorwayId).toBeTruthy();
    const vars = referenceUiThemeToCssVars(theme);
    expect(vars["--klean-accent"]).toMatch(/^#/);
    expect(vars["--klean-bg-deep"]).toMatch(/^#/);
  });
});
