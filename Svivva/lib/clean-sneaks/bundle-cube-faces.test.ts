import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BUNDLE_CUBE_FACE_URLS, STIEHL_LOGO_CUBE_URL } from "./assets";

describe("Steal Bundle cube faces", () => {
  it("exposes six unique face URLs for the entry cube", () => {
    expect(BUNDLE_CUBE_FACE_URLS).toHaveLength(6);
    expect(new Set(BUNDLE_CUBE_FACE_URLS).size).toBe(6);
    for (const url of BUNDLE_CUBE_FACE_URLS) {
      expect(url).toMatch(/^\/assets\/clean-sneaks\/bundle-cube-faces\/face-0[1-6]\.jpg$/);
    }
  });

  it("ships every face file under public/", () => {
    const publicRoot = resolve(__dirname, "../../public");
    for (const url of BUNDLE_CUBE_FACE_URLS) {
      const filePath = resolve(publicRoot, url.replace(/^\//, ""));
      expect(existsSync(filePath), `missing ${filePath}`).toBe(true);
    }
  });

  it("keeps the legacy single-face logo path for references", () => {
    expect(STIEHL_LOGO_CUBE_URL).toBe("/assets/clean-sneaks/stiehl-logo-cube.jpg");
  });
});
