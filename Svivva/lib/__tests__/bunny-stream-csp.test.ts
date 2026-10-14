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

  it("embeds Bunny Stream on the homepage intro with thumbnail poster", () => {
    const page = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    expect(page).toContain("INTRO_BUNNY_STREAM_PLAY");
    expect(page).toContain("INTRO_BUNNY_THUMBNAIL");
    expect(page).toContain("vz-2b70ed0c-5f4.b-cdn.net");
    expect(page).toContain("player.mediadelivery.net/embed/");
    expect(page).toContain("muted=true");
    expect(page).toContain("introVideoPlaying");
    expect(page).toContain("eagerMount");
    expect(page).toContain("The inspiration for the site in one episode");
    expect(page).not.toMatch(/disableFlowers/);
  });
});
