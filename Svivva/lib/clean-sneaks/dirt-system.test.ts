import { describe, expect, it } from "vitest";
import {
  applySubstanceToShoe,
  createEmptyShoeCondition,
  pairCleanliness,
  shoeCleanliness,
  applyCreaseWear,
} from "@/lib/clean-sneaks/dirt-system";
import { suggestCleanPaths, visionForObstacle } from "@/lib/clean-sneaks/sneak-vision";
import { contactForObstacle } from "@/lib/clean-sneaks/contact-map";
import { getArchetype } from "@/lib/clean-sneaks/sneaker-catalog";
import {
  activateSneakVision,
  createRunEngineState,
  stepRunEngine,
  jumpRun,
  shiftLane,
} from "@/lib/clean-sneaks/run-engine";

describe("clean-sneaks dirt zones", () => {
  it("starts each shoe at 100% clean across all zones", () => {
    const shoe = createEmptyShoeCondition();
    expect(shoeCleanliness(shoe)).toBe(100);
    expect(shoe.dirt.toeBox.amount).toBe(0);
    expect(shoe.dirt.outsole.amount).toBe(0);
  });

  it("lands shallow water mostly on the outsole", () => {
    const shoe = createEmptyShoeCondition();
    const { shoe: next, hitZones } = applySubstanceToShoe({
      shoe,
      substance: "water",
      material: "leather",
      splash: false,
    });
    expect(hitZones).toContain("outsole");
    expect(next.dirt.outsole.amount).toBeGreaterThan(0);
    expect(next.dirt.tongue.amount).toBe(0);
  });

  it("splash adds midsole / upper contact", () => {
    const shoe = createEmptyShoeCondition();
    const { hitZones } = applySubstanceToShoe({
      shoe,
      substance: "water",
      material: "leather",
      splash: true,
    });
    expect(hitZones).toContain("midsole");
    expect(hitZones).toContain("toeBox");
  });

  it("suede takes more water damage than patent leather", () => {
    const base = createEmptyShoeCondition();
    const suede = applySubstanceToShoe({
      shoe: base,
      substance: "water",
      material: "suede",
      intensity: 1,
    });
    const patent = applySubstanceToShoe({
      shoe: createEmptyShoeCondition(),
      substance: "water",
      material: "patent",
      intensity: 1,
    });
    expect(suede.amountApplied).toBeGreaterThan(patent.amountApplied);
  });

  it("tracks left and right shoes independently", () => {
    let left = createEmptyShoeCondition();
    let right = createEmptyShoeCondition();
    left = applySubstanceToShoe({
      shoe: left,
      substance: "mud",
      material: "leather",
    }).shoe;
    expect(shoeCleanliness(left)).toBeLessThan(shoeCleanliness(right));
    expect(pairCleanliness(left, right)).toBeGreaterThan(shoeCleanliness(left));
  });

  it("crease walk reduces crease accumulation vs sprinting", () => {
    let stiff = createEmptyShoeCondition();
    let sprint = createEmptyShoeCondition();
    for (let i = 0; i < 30; i++) {
      stiff = applyCreaseWear(stiff, {
        sprinting: false,
        creaseWalk: true,
        dt: 0.1,
        jumping: false,
      });
      sprint = applyCreaseWear(sprint, {
        sprinting: true,
        creaseWalk: false,
        dt: 0.1,
        jumping: false,
      });
    }
    expect(stiff.creases).toBeLessThan(sprint.creases);
  });
});

describe("sneak vision + clean path", () => {
  it("maps mud to disaster and water to wet", () => {
    expect(visionForObstacle("mud")).toBe("disaster");
    expect(visionForObstacle("water")).toBe("wet");
    expect(visionForObstacle("gum")).toBe("caution");
  });

  it("suggests fast / safe / style routes", () => {
    const paths = suggestCleanPaths({
      obstacles: [
        { kind: "mud", lane: 1, z: -20, hit: false },
        { kind: "water", lane: 0, z: -15, hit: false },
        { kind: "bike", lane: 2, z: -18, hit: false },
      ],
      currentLane: 1,
      cleanliness: 92,
    });
    expect(paths).toHaveLength(3);
    expect(paths.map((p) => p.kind).sort()).toEqual(["fast", "safe", "style"].sort());
    const safe = paths.find((p) => p.kind === "safe")!;
    expect(safe.predictedClean).toBeGreaterThan(50);
  });
});

describe("contact + archetypes", () => {
  it("maps pedestrian step-on to toe box dust", () => {
    const c = contactForObstacle("pedestrian");
    expect(c.substance).toBe("dust");
    expect(c.zones).toContain("toeBox");
    expect(c.canScuff).toBe(true);
  });

  it("luxury sneakers punish damage harder", () => {
    expect(getArchetype("luxury").damagePenalty).toBeGreaterThan(
      getArchetype("beatUp").damagePenalty,
    );
    expect(getArchetype("meshRunner").agility).toBeGreaterThan(getArchetype("highTop").agility);
  });
});

describe("run engine systems", () => {
  it("activates sneak vision with cooldown", () => {
    const s = createRunEngineState();
    s.running = true;
    expect(activateSneakVision(s, 1000)).toBe(true);
    expect(s.sneakVisionUntil).toBeGreaterThan(1000);
    expect(activateSneakVision(s, 1100)).toBe(false);
  });

  it("dirt from mud reduces pair cleanliness", () => {
    const s = createRunEngineState();
    s.running = true;
    s.lastTs = 0;
    s.obstacles.push({
      id: 1,
      kind: "mud",
      lane: 1,
      z: 0,
      hit: false,
      cleared: false,
      closeCalled: false,
      ohNoOffered: true,
    });
    let over = false;
    stepRunEngine(s, 0.05, 100, { onGameOver: () => (over = true) });
    expect(s.obstacles[0]!.hit || s.cleanliness < 100).toBe(true);
    void over;
  });

  it("lane shift and jump still work", () => {
    const s = createRunEngineState();
    s.running = true;
    shiftLane(s, 1);
    expect(s.targetLane).toBe(2);
    jumpRun(s);
    expect(s.grounded).toBe(false);
  });
});
