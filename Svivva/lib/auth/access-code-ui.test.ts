import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

const UI_ROOT = resolve(__dirname, "../..");
const UI_DIRS = ["app", "components"].map((d) => join(UI_ROOT, d));

/** Literal passcodes must not appear in user-facing UI source. */
const FORBIDDEN_IN_UI = ["272727", "Enter code 333", "access code 333", "code 272727"];

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (name === "api") continue;
      collectSourceFiles(full, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(name) && !/\.test\.(tsx?|jsx?)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

describe("access codes are not exposed in UI", () => {
  const uiFiles = UI_DIRS.flatMap((dir) => collectSourceFiles(dir));

  for (const snippet of FORBIDDEN_IN_UI) {
    it(`does not print "${snippet}" in app/components source`, () => {
      const offenders = uiFiles.filter((file) => readFileSync(file, "utf8").includes(snippet));
      expect(offenders).toEqual([]);
    });
  }
});

describe("/admin owner entry", () => {
  it("exists and uses AdminCodeForm without printing passcodes", () => {
    const src = readFileSync(resolve(UI_ROOT, "app/admin/page.tsx"), "utf8");
    expect(src).toContain("AdminCodeForm");
    expect(src).not.toContain("272727");
    expect(src).not.toContain("333");
  });
});
