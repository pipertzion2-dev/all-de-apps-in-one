import { describe, expect, it } from "vitest";
import { runQualityFlags } from "./run-quality";

describe("run-quality", () => {
  it("mobile tier disables heavy GPU features", () => {
    const flags = runQualityFlags("mobile");
    expect(flags.postFx).toBe(false);
    expect(flags.pmremEnvironment).toBe(false);
    expect(flags.castShadows).toBe(false);
    expect(flags.contactShadows).toBe(false);
    expect(flags.sky).toBe(false);
    expect(flags.bubbleCount).toBeLessThan(500);
  });

  it("full tier enables desktop features", () => {
    const flags = runQualityFlags("full");
    expect(flags.postFx).toBe(true);
    expect(flags.pmremEnvironment).toBe(true);
    expect(flags.castShadows).toBe(true);
  });
});
