import { describe, expect, it } from "vitest";
import { hardwareAiFallbackNotice } from "./ai-errors";

describe("hardwareAiFallbackNotice", () => {
  it("uses friendly copy for supplier fallback", () => {
    expect(hardwareAiFallbackNotice("suppliers")).toContain("Starter supplier list");
    expect(hardwareAiFallbackNotice("suppliers")).not.toContain("EasyPeasy");
  });

  it("uses friendly copy for sketch fallback", () => {
    expect(hardwareAiFallbackNotice("sketch")).toContain("Starter brief");
  });
});
