import { describe, expect, it } from "vitest";
import { parseExternalAnalyticsConfig } from "./external-signals";

function shouldEmitTrafficDrop(config: ReturnType<typeof parseExternalAnalyticsConfig>): boolean {
  return (
    config.sessions7d != null &&
    config.previousSessions7d != null &&
    config.previousSessions7d > 0 &&
    config.sessions7d < config.previousSessions7d * 0.7
  );
}

describe("external traffic drop detection", () => {
  it("detects >30% session decline", () => {
    const config = parseExternalAnalyticsConfig({
      externalAnalytics: { sessions7d: 60, previousSessions7d: 100 },
    });
    expect(shouldEmitTrafficDrop(config)).toBe(true);
  });

  it("ignores stable traffic", () => {
    const config = parseExternalAnalyticsConfig({
      externalAnalytics: { sessions7d: 90, previousSessions7d: 100 },
    });
    expect(shouldEmitTrafficDrop(config)).toBe(false);
  });
});
