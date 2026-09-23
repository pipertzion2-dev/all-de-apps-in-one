import { describe, expect, it } from "vitest";
import {
  ORBIT_SEO_CONNECT_PATH,
  ORBIT_SEO_CONNECT_STEPS,
  orbitSeoConnectUrl,
} from "../orbit/seo-connect";

describe("orbit SEO connect link", () => {
  it("exposes a stable shareable path for the SEO operator", () => {
    expect(ORBIT_SEO_CONNECT_PATH).toBe("/dashboard/orbit/connect");
    expect(orbitSeoConnectUrl("https://zzaizzai.com")).toBe(
      "https://zzaizzai.com/dashboard/orbit/connect",
    );
    expect(orbitSeoConnectUrl("https://zzaizzai.com/")).toBe(
      "https://zzaizzai.com/dashboard/orbit/connect",
    );
  });

  it("lists the three connect steps", () => {
    expect(ORBIT_SEO_CONNECT_STEPS.map((s) => s.id)).toEqual(["ai", "gsc", "launch"]);
  });
});
