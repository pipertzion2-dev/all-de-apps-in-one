import { describe, expect, it } from "vitest";
import {
  buildMeendLegatoTimeline,
  MEEND_PREVIEW_GAMAK_CENTS,
  MEEND_PREVIEW_TAIL_BOOST,
} from "./meend-preview-audio";
import { V1_GAMAK_START, V1_MEEND_TAIL_START } from "./meend-midi";

describe("meend preview audio", () => {
  it("attacks each swara with gamak in the middle and tail bend at 80%", () => {
    const beatToSec = (b: number) => b * 0.5;
    const timeline = buildMeendLegatoTimeline(
      [
        { note: 60, velocity: 90, startBeat: 0, duration: 1 },
        { note: 64, velocity: 90, startBeat: 1, duration: 1 },
      ],
      [],
      beatToSec,
      (midi) => `N${midi}`,
    );
    const attacks = timeline.filter((e) => e.type === "attack");
    expect(attacks.length).toBe(2);

    const tail = timeline.find((e) => e.type === "tailBend");
    expect(tail).toBeDefined();
    expect(tail!.time).toBeGreaterThanOrEqual(beatToSec(V1_MEEND_TAIL_START));
    expect(tail!.cents).toBeCloseTo(4 * 100 * MEEND_PREVIEW_TAIL_BOOST, 0);

    const gamak = timeline.filter((e) => e.type === "bend" && e.cents !== 0);
    expect(gamak[0]!.time).toBeGreaterThanOrEqual(beatToSec(V1_GAMAK_START));
    const peakGamak = Math.max(...gamak.map((b) => Math.abs(b.cents)));
    expect(peakGamak).toBeLessThanOrEqual(MEEND_PREVIEW_GAMAK_CENTS + 1);
    expect(peakGamak).toBeGreaterThan(80);
  });
});
