import { describe, expect, it } from "vitest";
import {
  isValidAdsenseClientId,
  isValidAdsenseSlotId,
  normalizeAdsenseClientId,
  normalizeAdsenseSlotId,
} from "@/lib/adsense-credentials";

describe("adsense credentials", () => {
  it("accepts ca-pub- ids and normalizes pub- paste", () => {
    expect(isValidAdsenseClientId("ca-pub-1234567890123456")).toBe(true);
    expect(normalizeAdsenseClientId("pub-1234567890123456")).toBe("ca-pub-1234567890123456");
    expect(normalizeAdsenseClientId("not-a-client")).toBeNull();
  });

  it("accepts numeric slot ids", () => {
    expect(isValidAdsenseSlotId("1234567890")).toBe(true);
    expect(normalizeAdsenseSlotId(" 9988776655 ")).toBe("9988776655");
    expect(normalizeAdsenseSlotId("abc")).toBeNull();
  });
});
