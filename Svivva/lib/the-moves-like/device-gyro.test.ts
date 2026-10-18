import { describe, expect, it } from "vitest";
import { gyroMotionEnergy, gyroToCameraOffset, type GyroSample } from "./device-gyro";

function sample(partial: Partial<GyroSample>): GyroSample {
  return {
    alpha: null,
    beta: null,
    gamma: null,
    acceleration: null,
    rotationRate: null,
    timestamp: 0,
    ...partial,
  };
}

describe("device-gyro", () => {
  it("maps upright phone beta near center with little camera offset", () => {
    const o = gyroToCameraOffset(sample({ beta: 55, gamma: 0 }));
    expect(Math.abs(o.x)).toBeLessThan(0.05);
    expect(Math.abs(o.y)).toBeLessThan(0.05);
  });

  it("tilts camera when gamma leans left/right", () => {
    const left = gyroToCameraOffset(sample({ beta: 55, gamma: -45 }));
    const right = gyroToCameraOffset(sample({ beta: 55, gamma: 45 }));
    expect(left.y).toBeLessThan(0);
    expect(right.y).toBeGreaterThan(0);
  });

  it("clamps extreme tilts", () => {
    const o = gyroToCameraOffset(sample({ beta: 180, gamma: 90 }));
    expect(o.x).toBeLessThanOrEqual(0.85);
    expect(o.y).toBeLessThanOrEqual(0.95);
  });

  it("returns zero energy without motion data", () => {
    expect(gyroMotionEnergy(null)).toBe(0);
    expect(gyroMotionEnergy(sample({}))).toBe(0);
  });

  it("raises energy with rotation rate", () => {
    const e = gyroMotionEnergy(sample({ rotationRate: { alpha: 120, beta: 80, gamma: 40 } }));
    expect(e).toBeGreaterThan(0.3);
  });
});
