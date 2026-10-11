import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Bunny Stream CSP", () => {
  it("allows Bunny Stream player frames in Content-Security-Policy", () => {
    const headers = readFileSync(resolve(__dirname, "../security-headers.mjs"), "utf8");
    expect(headers).toContain("player.mediadelivery.net");
    expect(headers).toContain("BUNNY_STREAM_FRAME");
    expect(headers).toMatch(/frame-src[\s\S]*BUNNY_STREAM_FRAME/);
  });

  it("embeds Bunny Stream on the homepage intro", () => {
    const page = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    expect(page).toContain("INTRO_BUNNY_STREAM_SRC");
    expect(page).toContain("player.mediadelivery.net/embed/");
  });
});
