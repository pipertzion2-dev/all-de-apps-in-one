import { describe, expect, it } from "vitest";
import { CUBE_SUITE, cubeSuiteMiniAppNamesLine, listCubeSuiteMiniApps } from "./mini-app-suite";

describe("mini-app suite", () => {
  it("lists six cube mini apps", () => {
    const apps = listCubeSuiteMiniApps();
    expect(apps).toHaveLength(6);
    expect(new Set(apps.map((a) => a.id)).size).toBe(6);
  });

  it("names all faces in the suite pass line", () => {
    expect(cubeSuiteMiniAppNamesLine()).toContain("Play");
    expect(cubeSuiteMiniAppNamesLine()).toContain("Protect");
  });

  it("uses Suite Pass subscription framing", () => {
    expect(CUBE_SUITE.passName).toBe("Suite Pass");
    expect(CUBE_SUITE.launcherHeadline).toMatch(/mini apps/i);
  });

  it("contrasts Suite Pass with many SaaS tools and dual creation", () => {
    expect(CUBE_SUITE.vsManySaasTitle).toMatch(/SaaS/i);
    expect(CUBE_SUITE.sharedBrainBody).toMatch(/mixing-console|OaaS/i);
    expect(CUBE_SUITE.dualCreationBody).toMatch(/two|both|Hybrid/i);
  });
});
