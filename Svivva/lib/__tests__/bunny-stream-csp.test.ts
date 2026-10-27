import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Bunny Stream CSP", () => {
  it("allows Bunny Stream player frames in Content-Security-Policy", () => {
    const headers = readFileSync(resolve(__dirname, "../security-headers.mjs"), "utf8");
    expect(headers).toContain("player.mediadelivery.net");
    expect(headers).toContain("BUNNY_STREAM_FRAME");
    expect(headers).toContain("BUNNY_PLAYERJS_SCRIPT");
    expect(headers).toContain("assets.mediadelivery.net");
    expect(headers).toMatch(/frame-src[\s\S]*BUNNY_STREAM_FRAME/);
    expect(headers).toMatch(/script-src[\s\S]*BUNNY_PLAYERJS_SCRIPT/);
  });

  it("keeps Bunny Stream frame/script allowlists for embeds elsewhere on the site", () => {
    const headers = readFileSync(resolve(__dirname, "../security-headers.mjs"), "utf8");
    expect(headers).toContain("player.mediadelivery.net");
    expect(headers).toContain("assets.mediadelivery.net");
  });
});
