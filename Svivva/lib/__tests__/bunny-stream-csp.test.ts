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

  it("plays Bunny Stream on the homepage intro with chromeless MP4 + thumbnail", () => {
    const page = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    expect(page).toContain("INTRO_BUNNY_STREAM_PLAY");
    expect(page).toContain("INTRO_BUNNY_THUMBNAIL");
    expect(page).toContain("vz-2b70ed0c-5f4.b-cdn.net");
    expect(page).toContain("play_720p.mp4");
    expect(page).not.toContain("player.mediadelivery.net/embed/");
    expect(page).toContain("controls={false}");
    expect(page).toContain("eagerMount");
    expect(page).toContain("The inspiration for the site in one episode");
    expect(page).not.toMatch(/disableFlowers/);
  });

  it("allows Bunny CDN media for chromeless intro playback", () => {
    const headers = readFileSync(resolve(__dirname, "../security-headers.mjs"), "utf8");
    expect(headers).toMatch(/media-src[\s\S]*https:\/\/\*\.b-cdn\.net/);
  });
});
