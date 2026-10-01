import { describe, expect, it } from "vitest";
import { resolveFusionRunStep, FUSION_TASK_RUN_STEPS } from "./fusion-task-map";

describe("resolveFusionRunStep", () => {
  it("maps content tasks to svivva run steps", () => {
    expect(resolveFusionRunStep("content-aeo")).toBe("svivva-aeo");
    expect(resolveFusionRunStep("content-seo-pages")).toBe("svivva-seo-pages");
  });

  it("returns null for manual tasks", () => {
    expect(resolveFusionRunStep("content-channel-intel")).toBeNull();
    expect(resolveFusionRunStep("manual-reddit-sideproject")).toBeNull();
  });

  it("covers all hybrid playbook task mappings used in strategies", () => {
    const mapped = Object.keys(FUSION_TASK_RUN_STEPS);
    expect(mapped).toContain("tech-schema-jsonld");
    expect(mapped).toContain("content-parasite");
  });
});
