import { describe, expect, it } from "vitest";
import {
  HYBRID_GTM_STRATEGIES,
  getHybridStrategy,
  orbitTasksForHybridPlaybook,
} from "./hybrid-gtm-strategies";

describe("hybrid-gtm-strategies", () => {
  it("includes channel intel and PLG motions", () => {
    const ids = HYBRID_GTM_STRATEGIES.map((s) => s.id);
    expect(ids).toContain("channel-intel-loop");
    expect(ids).toContain("hybrid-pls");
    expect(ids).toContain("plg-activation");
  });

  it("resolves strategy by id", () => {
    expect(getHybridStrategy("answer-shaped-aeo")?.motion).toBe("aeo");
  });

  it("collects orbit task ids from playbook", () => {
    const tasks = orbitTasksForHybridPlaybook();
    expect(tasks).toContain("content-aeo");
    expect(tasks).toContain("content-channel-intel");
  });
});
