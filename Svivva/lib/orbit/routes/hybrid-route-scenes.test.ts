import { describe, expect, it } from "vitest";
import {
  HYBRID_ROUTE_SCENES,
  buildHybridSceneDestinations,
  getHybridRouteSceneByStrategy,
} from "./hybrid-route-scenes";
import { getHybridStrategy } from "../hybrid-gtm-strategies";

describe("buildHybridSceneDestinations", () => {
  it("starts with fusion and plan steps", () => {
    const strategy = getHybridStrategy("answer-shaped-aeo")!;
    const dest = buildHybridSceneDestinations(strategy);
    expect(dest[0].channel).toBe("fusion");
    expect(dest[1].channel).toBe("plan");
    expect(dest[1].config?.objective).toBe("traffic");
  });

  it("ends with autopilot", () => {
    const strategy = getHybridStrategy("plg-activation")!;
    const dest = buildHybridSceneDestinations(strategy);
    expect(dest.at(-1)?.channel).toBe("autopilot");
    expect(dest.at(-1)?.config?.force).toBe(false);
  });
});

describe("HYBRID_ROUTE_SCENES", () => {
  it("maps every playbook to a scene", () => {
    expect(HYBRID_ROUTE_SCENES.length).toBe(6);
    expect(getHybridRouteSceneByStrategy("channel-intel-loop")?.id).toBe(
      "hybrid:channel-intel-loop",
    );
  });

  it("uses hybrid: prefix ids", () => {
    for (const scene of HYBRID_ROUTE_SCENES) {
      expect(scene.id.startsWith("hybrid:")).toBe(true);
      expect(scene.destinations.some((d) => d.channel === "fusion")).toBe(true);
    }
  });
});
