import { describe, expect, it } from "vitest";
import { partitionAutopilotTasks, isManualOnlyTask } from "./marketing-task-buckets";
import type { AutopilotTaskResult } from "./marketing-autopilot-types";

function task(id: string, status: AutopilotTaskResult["status"]): AutopilotTaskResult {
  return { id, label: id, group: "Test", status, message: "" };
}

describe("marketing-task-buckets", () => {
  it("treats prepare_only tasks as manual", () => {
    expect(isManualOnlyTask("manual-medium")).toBe(true);
    expect(isManualOnlyTask("manual-devto")).toBe(false);
    expect(isManualOnlyTask("content-seo-pages")).toBe(false);
  });

  it("partitions automated vs manual tasks", () => {
    const { automated, manual } = partitionAutopilotTasks([
      task("content-seo-pages", "done"),
      task("manual-medium", "prepared"),
      task("manual-devto", "needs_credentials"),
    ]);
    expect(automated.map((t) => t.id)).toEqual(["content-seo-pages", "manual-devto"]);
    expect(manual.map((t) => t.id)).toEqual(["manual-medium"]);
  });
});
