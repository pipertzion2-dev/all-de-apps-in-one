import { describe, expect, it } from "vitest";
import { buildDepositAnalysisFallback } from "./deposit-analysis-fallback";

describe("buildDepositAnalysisFallback", () => {
  it("builds a complete deposit analysis from filename and palette", () => {
    const result = buildDepositAnalysisFallback(
      "smart-watch-v2.png",
      [
        { hex: "#1A2B3C", role: "dominant", weight: 0.5 },
        { hex: "#EEDDCC", role: "secondary", weight: 0.3 },
      ],
      "Wearable prototype sketch",
    );

    expect(result.title).toBe("Smart Watch V2");
    expect(result.description.length).toBeGreaterThan(40);
    expect(result.formInterrogation.silhouette.length).toBeGreaterThan(8);
    expect(result.paletteInterrogation.emotionalIntent).toContain("Cool");
    expect(result.chronology.iterationNotes).toContain("Wearable prototype sketch");
    expect(result.suggestedHybridMode).toBe("emergent");
  });
});
