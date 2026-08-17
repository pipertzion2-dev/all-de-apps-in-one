import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import {
  familyKeyFromFileName,
  groupMerkleCanonical,
  inferSheetRole,
  organizeGroupPatent,
} from "./group-organize";
import { merkleRootFromCanonical } from "./attestation";
import type { ColorSwatch, GroupImageInput } from "./types";

const teal: ColorSwatch[] = [{ hex: "#5B8DA8", role: "dominant", weight: 0.6 }];
const burgundy: ColorSwatch[] = [{ hex: "#6B2C4E", role: "dominant", weight: 0.6 }];

function img(
  fileName: string,
  hashChar: string,
  palette: ColorSwatch[] = teal,
  lastModifiedMs?: number,
): GroupImageInput {
  return {
    fileName,
    contentHash: hashChar.repeat(64),
    mimeType: "image/png",
    palette,
    lastModifiedMs,
  };
}

describe("group patent organizer", () => {
  it("strips view/version tokens into one family key", () => {
    expect(familyKeyFromFileName("crest-bloom-front.png")).toBe("crest bloom");
    expect(familyKeyFromFileName("crest-bloom-side.png")).toBe("crest bloom");
    expect(familyKeyFromFileName("crest-bloom-v2.png")).toBe("crest bloom");
    expect(familyKeyFromFileName("crest_bloom_detail.jpg")).toBe("crest bloom");
  });

  it("infers sheet roles from filenames", () => {
    expect(inferSheetRole("widget-front.png", 0, 3)).toBe("elevation");
    expect(inferSheetRole("widget-detail.png", 1, 3)).toBe("detail");
    expect(inferSheetRole("widget-v3.png", 2, 3)).toBe("iteration");
    expect(inferSheetRole("widget-cover.png", 0, 3)).toBe("overview");
    expect(inferSheetRole("widget-alt.png", 1, 3)).toBe("alternate");
  });

  it("organizes a dump of related views into numbered figures", () => {
    const organized = organizeGroupPatent([
      img("crest-bloom-side.png", "b", teal, Date.parse("2026-02-02")),
      img("crest-bloom-front.png", "a", teal, Date.parse("2026-02-01")),
      img("crest-bloom-detail.png", "c", teal, Date.parse("2026-02-03")),
      img("crest-bloom-v2.png", "d", teal, Date.parse("2026-03-01")),
    ]);

    expect(organized.familyCount).toBe(1);
    expect(organized.figureCount).toBe(4);
    expect(organized.title).toBe("Crest Bloom");
    expect(organized.sheets.map((s) => s.figure)).toEqual(["Fig. 1", "Fig. 2", "Fig. 3", "Fig. 4"]);
    expect(organized.sheets[0].role).toBe("elevation");
    expect(organized.sheets.some((s) => s.role === "detail")).toBe(true);
    expect(organized.sheets.some((s) => s.role === "iteration")).toBe(true);
    expect(organized.description).toMatch(/Fig\. 1/);
    expect(organized.chronologyHint.firstFixedOn).toBe("2026-03-01");
    expect(organized.interrogation.silhouette).toMatch(/figures/);
  });

  it("keeps distinct families when names and palettes diverge", () => {
    const organized = organizeGroupPatent([
      img("lock-core-front.png", "1", teal),
      img("lock-core-side.png", "2", teal),
      img("petal-lantern-cover.png", "3", burgundy),
      img("petal-lantern-detail.png", "4", burgundy),
    ]);
    expect(organized.familyCount).toBe(2);
    expect(organized.title).toMatch(/Group disclosure/);
    expect(organized.sheets).toHaveLength(4);
  });

  it("builds a stable merkle canonical that Node sha256 can seal", () => {
    const organized = organizeGroupPatent([img("a-front.png", "f"), img("a-side.png", "0")]);
    expect(organized.merkleCanonical).toBe(
      groupMerkleCanonical(organized.sheets.map((s) => s.contentHash)),
    );
    const root = merkleRootFromCanonical(organized.merkleCanonical);
    expect(root).toHaveLength(64);
    expect(root).toBe(createHash("sha256").update(organized.merkleCanonical, "utf8").digest("hex"));
  });
});
