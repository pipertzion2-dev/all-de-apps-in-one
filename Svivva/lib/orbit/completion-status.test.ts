import { describe, expect, it } from "vitest";
import { buildOrbitCompletionSnapshot } from "./completion-status";
import type { AutopilotTaskResult } from "./marketing-autopilot-types";

function t(id: string, status: AutopilotTaskResult["status"], label = id): AutopilotTaskResult {
  return {
    id,
    label,
    group: "test",
    status,
    message: "msg",
    copyText: `copy for ${id}`,
  };
}

describe("buildOrbitCompletionSnapshot", () => {
  it("prioritizes Show HN as next paste action", () => {
    const snap = buildOrbitCompletionSnapshot([
      t("tech-indexnow-key", "done"),
      t("manual-medium", "prepared", "Medium"),
      t("manual-showhn", "prepared", "Show HN"),
      t("dir-futurepedia", "prepared", "Futurepedia"),
      t("manual-devto", "needs_credentials", "Dev.to"),
    ]);
    expect(snap.nextAction?.id).toBe("manual-showhn");
    expect(snap.blockedCount).toBe(1);
    expect(snap.manualLeftCount).toBe(3);
    expect(snap.summaryLine).toContain("Next: Show HN");
  });

  it("respects locally marked-done paste tasks", () => {
    const snap = buildOrbitCompletionSnapshot(
      [t("manual-showhn", "prepared", "Show HN"), t("dir-futurepedia", "prepared", "Futurepedia")],
      { manualDoneIds: ["manual-showhn"] },
    );
    expect(snap.nextAction?.id).toBe("dir-futurepedia");
    expect(snap.doneCount).toBe(1);
    expect(snap.manualLeftCount).toBe(1);
  });

  it("reports automatable complete when only paste leftovers remain", () => {
    const snap = buildOrbitCompletionSnapshot([
      t("tech-indexnow-submitted", "done"),
      t("manual-devto", "posted"),
      t("manual-showhn", "prepared", "Show HN"),
    ]);
    expect(snap.automatableComplete).toBe(true);
    expect(snap.nextAction?.label).toBe("Show HN");
  });
});
