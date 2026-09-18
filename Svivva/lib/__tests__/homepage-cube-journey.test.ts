import { describe, expect, it } from "vitest";
import {
  hashForJourneyFace,
  journeyFaceFromHash,
  nextJourneyFace,
  prevJourneyFace,
  rotationForJourneyFace,
} from "../homepage-cube-journey";

describe("homepage cube journey", () => {
  it("maps legacy hash ids to journey faces", () => {
    expect(journeyFaceFromHash("nav-cube")).toBe("begin");
    expect(journeyFaceFromHash("home-game")).toBe("game");
    expect(journeyFaceFromHash("clean-sneaks")).toBe("game");
    expect(journeyFaceFromHash("home-explore")).toBe("home");
  });

  it("round-trips hash helpers", () => {
    expect(hashForJourneyFace("begin")).toBe("nav-cube");
    expect(hashForJourneyFace("game")).toBe("home-game");
    expect(hashForJourneyFace("home")).toBe("home-explore");
  });

  it("cycles through begin → game → home", () => {
    expect(nextJourneyFace("begin")).toBe("game");
    expect(nextJourneyFace("game")).toBe("home");
    expect(nextJourneyFace("home")).toBe("begin");
    expect(prevJourneyFace("begin")).toBe("home");
  });

  it("uses a tri-corner rotation on the begin face", () => {
    const corner = rotationForJourneyFace("begin", true);
    const front = rotationForJourneyFace("begin", false);
    expect(corner.x).not.toBe(front.x);
    expect(corner.y).not.toBe(front.y);
  });
});
