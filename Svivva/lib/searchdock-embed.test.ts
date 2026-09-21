import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("SearchDock site-agent embed", () => {
  it("loads the SearchDock SDK snippet on the root layout", () => {
    const src = readFileSync(join(__dirname, "../app/layout.tsx"), "utf8");
    expect(src).toContain("app.searchdock.io/api/v1/site-agent/sdk");
    expect(src).toContain("app.searchdock.io/api/v1/site-agent/heartbeat");
    expect(src).toContain("sd-ab55f04b597744436666877149dd1b56");
    expect(src).toContain("data-token={SEARCHDOCK_TOKEN}");
    expect(src).toContain("data-endpoint={SEARCHDOCK_ENDPOINT}");
  });
});
