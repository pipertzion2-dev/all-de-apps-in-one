import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");

describe("clean-sneaks loading freeze guard", () => {
  it("keeps the page shell free of sync Game3D / shop / ads imports", () => {
    const src = readFileSync(resolve(root, "app/clean-sneaks/page.tsx"), "utf8");
    expect(src).toMatch(/dynamic\(/);
    expect(src).toMatch(/CleanSneaksGame3D/);
    expect(src).not.toMatch(
      /import\s+\{\s*CleanSneaksGame3D\s*\}\s+from\s+["']@\/components\/clean-sneaks\/CleanSneaksGame3D["']/,
    );
    expect(src).not.toMatch(/import\s+\{\s*StealTheBundleCardGame\s*\}\s+from/);
    expect(src).toMatch(/preloadMainGameCover/);
    expect(src).toMatch(/advancePastLoading/);
    expect(src).toMatch(/pendingStartRef/);
    // Do not mount the game engine during the Karen splash.
    expect(src).toMatch(/gamePhase === "loading" && !introComplete \? null/);
  });

  it("does not preload RunScene during the loading phase", () => {
    const src = readFileSync(
      resolve(root, "components/clean-sneaks/CleanSneaksGame3D.tsx"),
      "utf8",
    );
    expect(src).toMatch(/skipIntroLoading/);
    expect(src).toMatch(/Do NOT preload CleanSneaksRunScene/);
    expect(src).not.toMatch(/phase !== "loading"[\s\S]*void import\("\.\/CleanSneaksRunScene"\)/);
    expect(src).not.toMatch(
      /if \(!active \|\| phase !== "loading"\) return;\s*void import\("\.\/CleanSneaksRunScene"\)/,
    );
  });

  it("exposes a tap-to-continue escape on the loading wheels", () => {
    const src = readFileSync(
      resolve(root, "components/clean-sneaks/GameLoadingWheels.tsx"),
      "utf8",
    );
    expect(src).toMatch(/onSkip/);
    expect(src).toMatch(/button-skip-loading/);
    expect(src).toMatch(/Tap to continue/);
  });
});
