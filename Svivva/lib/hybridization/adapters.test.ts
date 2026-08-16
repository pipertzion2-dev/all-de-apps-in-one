import { describe, expect, it } from "vitest";
import { adaptLegacySystems, adaptSourcesToSchematics, inferDomain } from "./adapters";
import { DOMAIN_BRIDGES, pickDomainBridge, SCIENTIFIC_PROTOCOL_VERSION } from "./principles";

describe("hybridization scientific protocol", () => {
  it("exposes a stable protocol version", () => {
    expect(SCIENTIFIC_PROTOCOL_VERSION).toBe("1.0.0");
    expect(DOMAIN_BRIDGES.length).toBeGreaterThanOrEqual(3);
  });

  it("picks Fourier–Ohm–Darcy bridge for thermal × electrical", () => {
    const bridge = pickDomainBridge("thermal", "electrical");
    expect(bridge.id).toBe("fourier-ohm-darcy");
    expect(bridge.principle.toLowerCase()).toContain("fourier");
  });

  it("adapts legacy systemA/systemB into schematics with domains", () => {
    const { schematicA, schematicB } = adaptLegacySystems({
      systemA: {
        name: "Copper heatsink",
        description: "thermal cooling vapor chamber",
        components: ["evaporator", "condenser"],
      },
      systemB: {
        name: "PCB power plane",
        description: "electrical distribution mesh",
      },
    });
    expect(schematicA.domain).toBe("thermal");
    expect(schematicB.domain).toBe("electrical");
    expect(schematicA.coreComponents.length).toBeGreaterThan(0);
    expect(schematicB.coreComponents.length).toBeGreaterThan(0);
  });

  it("adapts hypothesis sources into paired schematics", () => {
    const adapted = adaptSourcesToSchematics([
      { name: "Weather API", type: "digital_api", description: "forecast data feed" },
      { name: "Smart packaging", type: "hardware_component", description: "thermal sensors" },
    ]);
    expect(adapted).not.toBeNull();
    expect(adapted!.schematicA.name).toBe("Weather API");
    expect(adapted!.schematicB.name).toBe("Smart packaging");
  });

  it("infers digital domain from API language", () => {
    expect(inferDomain("REST API endpoint SaaS")).toBe("digital");
  });
});
