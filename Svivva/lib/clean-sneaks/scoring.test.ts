import { describe, expect, it } from "vitest";
import {
  cleanLabelFrom,
  cleanlinessMultiplier,
  resolvePlayerSneaker,
  shouldLoadSneakerSprite,
  streakLabelFrom,
  streakMultiplier,
} from "@/lib/clean-sneaks/assets";
import { computeFrameScore } from "@/lib/clean-sneaks/storage";

describe("clean-sneaks scoring", () => {
  it("labels cleanliness bands", () => {
    expect(cleanLabelFrom(100)).toBe("FRESH");
    expect(cleanLabelFrom(70)).toBe("CLEAN");
    expect(cleanLabelFrom(50)).toBe("GETTING DIRTY");
    expect(cleanLabelFrom(30)).toBe("DIRTY");
    expect(cleanLabelFrom(10)).toBe("FILTHY");
    expect(cleanLabelFrom(0)).toBe("COOKED");
  });

  it("rewards cleaner shorter runs over filthy distance", () => {
    const cleanShort = computeFrameScore({
      distanceDelta: 10,
      cleanliness: 95,
      streak: 5,
      freshKicksActive: false,
    });
    const filthyLong = computeFrameScore({
      distanceDelta: 18,
      cleanliness: 15,
      streak: 0,
      freshKicksActive: false,
    });
    expect(cleanShort).toBeGreaterThan(filthyLong);
  });

  it("escalates streak multipliers", () => {
    expect(streakMultiplier(1)).toBe(1);
    expect(streakMultiplier(3)).toBe(2);
    expect(streakMultiplier(12)).toBe(5);
    expect(streakLabelFrom(12)).toBe("FRESH x5");
    expect(cleanlinessMultiplier(95)).toBeGreaterThan(cleanlinessMultiplier(25));
  });

  it("resolves default sneaker asset path for replacement", () => {
    const s = resolvePlayerSneaker();
    expect(s.spriteUrl).toBe("/assets/clean-sneaks/baloon8-sneaker-thumbnail.png");
    expect(s.label).toBe("Baloon8");
    const custom = resolvePlayerSneaker({
      spriteUrl: "/assets/clean-sneaks/user-design.png",
      source: "user",
      label: "Mine",
    });
    expect(custom.source).toBe("user");
    expect(custom.spriteUrl).toContain("user-design");
    expect(custom.useWalkingSprite).toBe(false);
  });

  it("never loads the legacy car-shoe PNG in gameplay", () => {
    expect(shouldLoadSneakerSprite(resolvePlayerSneaker())).toBe(false);
    expect(
      shouldLoadSneakerSprite(
        resolvePlayerSneaker({ spriteUrl: "/assets/clean-sneaks/player-shoe.png" }),
      ),
    ).toBe(false);
    expect(
      shouldLoadSneakerSprite(
        resolvePlayerSneaker({
          spriteUrl: "/assets/clean-sneaks/user-design.png",
          useWalkingSprite: false,
        }),
      ),
    ).toBe(true);
  });
});
