import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("CleanSneaksRunScene freeze guards", () => {
  const src = readFileSync(
    resolve(__dirname, "../../components/clean-sneaks/CleanSneaksRunScene.tsx"),
    "utf8",
  );

  it("reuses pooled clean-path footprints instead of clear()+new PlaneGeometry each frame", () => {
    expect(src).toContain("syncCleanPathFootprints");
    expect(src).toContain("createCleanPathFootprintPool");
    expect(src).not.toMatch(/pathG\.clear\s*\(/);
    expect(src).not.toMatch(/new THREE\.PlaneGeometry\(0\.22,\s*0\.38\)/);
  });
});
