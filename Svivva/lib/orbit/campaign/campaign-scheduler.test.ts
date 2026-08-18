import { describe, expect, it } from "vitest";
import {
  isCampaignInWindow,
  deriveCampaignSchedule,
  assertCampaignInWindow,
  CampaignWindowError,
} from "./campaign-scheduler";

describe("isCampaignInWindow", () => {
  it("returns true when no schedule bounds", () => {
    expect(isCampaignInWindow({ startsAt: null, endsAt: null })).toBe(true);
  });

  it("blocks before start", () => {
    const startsAt = new Date("2026-08-20T00:00:00Z");
    expect(isCampaignInWindow({ startsAt, endsAt: null }, new Date("2026-08-19T12:00:00Z"))).toBe(
      false,
    );
  });

  it("blocks after end", () => {
    const endsAt = new Date("2026-08-10T00:00:00Z");
    expect(isCampaignInWindow({ startsAt: null, endsAt }, new Date("2026-08-18T12:00:00Z"))).toBe(
      false,
    );
  });

  it("allows inside window", () => {
    const startsAt = new Date("2026-08-01T00:00:00Z");
    const endsAt = new Date("2026-08-31T00:00:00Z");
    expect(
      isCampaignInWindow({ startsAt, endsAt }, new Date("2026-08-15T12:00:00Z")),
    ).toBe(true);
  });
});

describe("deriveCampaignSchedule", () => {
  it("derives endsAt from durationDays", () => {
    const startsAt = new Date("2026-08-01T00:00:00Z");
    const { endsAt } = deriveCampaignSchedule({ startsAt, durationDays: 7 });
    expect(endsAt?.toISOString()).toBe("2026-08-08T00:00:00.000Z");
  });
});

describe("assertCampaignInWindow", () => {
  it("throws CampaignWindowError outside window", () => {
    expect(() =>
      assertCampaignInWindow(
        {
          name: "Launch",
          startsAt: new Date("2026-09-01T00:00:00Z"),
          endsAt: null,
        },
        new Date("2026-08-18T00:00:00Z"),
      ),
    ).toThrow(CampaignWindowError);
  });
});
