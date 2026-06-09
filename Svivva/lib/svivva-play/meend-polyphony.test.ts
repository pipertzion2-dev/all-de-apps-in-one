import { describe, expect, it } from "vitest";
import { prepareMeendPreviewEvents, stemHasOverlappingNotes } from "./scale-key-guard";

describe("meend polyphony", () => {
  it("detects simultaneous chord notes", () => {
    expect(
      stemHasOverlappingNotes([
        { startBeat: 0, duration: 1 },
        { startBeat: 0, duration: 1 },
      ]),
    ).toBe(true);
  });

  it("does not extend a note past the next onset on hocket grids", () => {
    const prepped = prepareMeendPreviewEvents([
      { startBeat: 0, duration: 0.25 },
      { startBeat: 0.5, duration: 0.25 },
      { startBeat: 1, duration: 0.25 },
    ]);
    expect(prepped[0]!.duration).toBeLessThanOrEqual(0.46);
    expect(prepped[1]!.duration).toBeLessThanOrEqual(0.46);
  });
});
