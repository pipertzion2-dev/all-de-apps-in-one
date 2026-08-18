import { describe, expect, it } from "vitest";
import {
  buildDigitalCanonicalPayload,
  buildDigitalScientificAxes,
  paletteFromContentHash,
} from "./digital-patent";
import type { DigitalDisclosure, ProtectRequest } from "./types";

const disclosure: DigitalDisclosure = {
  kind: "digital_patent",
  inventionType: "software",
  problemStatement: "Teams lose track of invention disclosures before filing.",
  novelSteps: "Step 1 hash canonical JSON. Step 2 seal dual axes. Step 3 deliver court PDF.",
  technicalEffect: "Creates a tamper-evident anteriority record without uploading source.",
  dataStructures: "Disclosure object with artifacts array and merkle-friendly canonical JSON.",
  apiSurface: "POST /api/poor-man-protection/protect with patentKind digital.",
  userFlow: "User fills disclosure, browser hashes, wizard seals and emails certificate.",
  artifacts: [
    {
      fileName: "core.ts",
      contentHash: "b".repeat(64),
    },
  ],
  sourceExcerpt: "export function seal() { return hash(canonical); }",
};

const digitalRequest: ProtectRequest = {
  patentKind: "digital",
  title: "Dual-axis digital seal",
  description: "A browser-local poor man's patent flow for software inventions.",
  formVariable: "Problem + novel steps",
  paletteVariable: "Data + API surface",
  contentHash: "a".repeat(64),
  mimeType: "application/zzai-digital-patent",
  palette: paletteFromContentHash("a".repeat(64)),
  digitalDisclosure: disclosure,
  hybridizationMode: "emergent",
};

describe("digital-patent", () => {
  it("derives a stable palette from the content hash", () => {
    const palette = paletteFromContentHash("a".repeat(64));
    expect(palette).toHaveLength(5);
    expect(palette[0]?.hex).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(1, 2);
  });

  it("builds canonical payload with sorted artifact hashes", () => {
    const payload = buildDigitalCanonicalPayload({
      title: "Test",
      description: "Desc",
      disclosure,
    });
    expect(payload).toContain("digital_patent");
    expect(payload).toContain("core.ts");
  });

  it("builds logic × interface scientific axes for digital patents", () => {
    const axes = buildDigitalScientificAxes(digitalRequest, disclosure);
    expect(axes.axisA.name).toBe("logic_algorithm");
    expect(axes.axisB.name).toBe("data_interface");
    expect(axes.measurableClaims.some((c) => c.includes("Invention class"))).toBe(true);
    expect(axes.measurableClaims.some((c) => c.includes("Content hash"))).toBe(true);
  });
});
