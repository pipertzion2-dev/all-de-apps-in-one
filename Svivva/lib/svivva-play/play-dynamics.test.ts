import { describe, expect, it } from "vitest";
import { applyPlayDynamicsToStems } from "./play-dynamics";

describe("applyPlayDynamicsToStems", () => {
  it("shapes velocities without collapsing to silence", () => {
    const stems = applyPlayDynamicsToStems(
      [
        {
          name: "Violin 1",
          role: "melody",
          instrumentHint: "violin",
          midiEvents: [
            { note: 62, velocity: 72, startBeat: 0, duration: 1 },
            { note: 64, velocity: 72, startBeat: 1, duration: 1 },
            { note: 65, velocity: 72, startBeat: 2, duration: 1 },
            { note: 67, velocity: 72, startBeat: 3, duration: 1 },
          ],
        },
      ],
      120,
      { strength: 0.5 },
    );
    const vels = stems[0]!.midiEvents.map((e) => e.velocity);
    expect(Math.max(...vels) - Math.min(...vels)).toBeGreaterThan(4);
    expect(vels.every((v) => v >= 28 && v <= 118)).toBe(true);
  });

  it("preserves percussion punch range", () => {
    const stems = applyPlayDynamicsToStems(
      [
        {
          name: "Suspended Cymbal · Triangle · Cabasa",
          role: "percussion",
          instrumentHint: "suspended cymbal",
          midiEvents: [
            { note: 43, velocity: 40, startBeat: 0, duration: 2 },
            { note: 45, velocity: 50, startBeat: 2, duration: 0.1 },
          ],
        },
      ],
      100,
    );
    expect(stems[0]!.midiEvents[0]!.velocity).toBeGreaterThanOrEqual(30);
  });
});
