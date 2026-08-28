import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "../..");

function readJson(relative: string): { crons?: { path: string; schedule: string }[] } {
  return JSON.parse(readFileSync(resolve(root, relative), "utf8"));
}

describe("burns daily schedule", () => {
  // Both configs are deployed (root builds from Svivva/), so they must agree.
  const configs = ["vercel.json", "../vercel.json"];

  for (const config of configs) {
    it(`runs burns at 06:00 daily in ${config}`, () => {
      const crons = readJson(config).crons ?? [];
      const burns = crons.find((c) => c.path.includes("job=burns"));
      expect(burns, `no burns cron in ${config}`).toBeDefined();
      expect(burns!.schedule).toBe("0 6 * * *");
    });

    it(`does not also run the seo job at 06:00 in ${config}`, () => {
      // Burns performs the seo job's work as graph nodes; keeping both would
      // double-submit IndexNow and push the sitemap twice every morning.
      const crons = readJson(config).crons ?? [];
      const sixAm = crons.filter((c) => c.schedule === "0 6 * * *");
      expect(sixAm).toHaveLength(1);
      expect(sixAm[0].path).toContain("job=burns");
    });
  }

  it("dispatches job=burns in the cron route", () => {
    const src = readFileSync(resolve(root, "app/api/cron/run-scheduled/route.ts"), "utf8");
    expect(src).toContain('job === "burns"');
    expect(src).toContain("runBurnsSystem");
    // The run must be recorded, otherwise the dashboard shows nothing after 6am.
    expect(src).toContain("saveBurnsRun");
  });

  it("keeps the burns estimate inside the cron maxDuration", () => {
    const src = readFileSync(resolve(root, "app/api/burns/run/route.ts"), "utf8");
    expect(src).toContain("maxDuration = 300");
  });
});
