/**
 * Fixed scientific protocol for cross-domain hybridization.
 * Tools must use these principles — not free-form “synergy” language.
 */

export const SCIENTIFIC_PROTOCOL_VERSION = "1.0.0";

/** Transport-law isomorphisms used to bridge engineering domains. */
export const DOMAIN_BRIDGES = [
  {
    id: "fourier-ohm-darcy",
    domains: ["thermal", "electrical", "fluidic"] as const,
    principle:
      "Fourier's law q=-k∇T, Ohm's law J=σE, and Darcy's law q=-(k/μ)∇P are isomorphic flux–gradient relations; all reduce to Laplace ∇²φ=0 in steady state.",
    invariants: ["flux conservation", "potential continuity", "linear constitutive response"],
  },
  {
    id: "wave-equation",
    domains: ["acoustic", "rf", "optical", "mechanical"] as const,
    principle:
      "The wave equation ∂²u/∂t² = c²∇²u unifies acoustics, electromagnetics, and elastic waves; impedance matching and bandgaps transfer across domains.",
    invariants: ["wave speed c", "impedance Z", "dispersion relation ω(k)"],
  },
  {
    id: "reaction-diffusion",
    domains: ["chemical", "thermal", "fluidic"] as const,
    principle:
      "Reaction–diffusion (∂c/∂t = D∇²c + R(c)) and heat equations share Green's-function structure; pattern formation (Turing) maps to thermal/flow instabilities.",
    invariants: ["diffusivity D", "Damköhler number", "characteristic length √(D/k)"],
  },
  {
    id: "information-energy",
    domains: ["digital", "information", "electrical", "thermal"] as const,
    principle:
      "Landauer's principle and Shannon mutual information I(X;Y) couple computation to energy; API/data graphs obey conservation of information flow analogous to Kirchhoff laws.",
    invariants: ["mutual information", "channel capacity", "energy per bit"],
  },
] as const;

export const BIOMIMETIC_LIBRARY = [
  {
    name: "Lotus leaf",
    principle: "Hierarchical roughness → contact angle >160°, self-cleaning Cassie–Baxter state",
  },
  {
    name: "Gecko setae",
    principle: "Van der Waals adhesion arrays ≈10 N/cm², directionally releasable",
  },
  {
    name: "Mantis shrimp dactyl",
    principle: "Bouligand helicoidal fiber reinforcement → impact toughness without mass penalty",
  },
  {
    name: "Nacre",
    principle: "Brick-and-mortar microstructure → toughness ~3000× monolithic mineral",
  },
  {
    name: "Termite mound",
    principle: "Passive buoyancy-driven ventilation via porosity and chimney topology",
  },
  {
    name: "Whale fin tubercles",
    principle: "Leading-edge tubercles as vortex generators → delayed stall, lower drag",
  },
  {
    name: "Moth eye",
    principle: "Gradient-index nanostructure → broadband anti-reflection",
  },
] as const;

export const MODE_GUIDANCE: Record<string, string> = {
  complementary:
    "Each system fills the other's weaknesses — map where A's strengths compensate B's limits and vice versa using shared transport invariants.",
  antagonistic:
    "Systems work in opposition to create equilibrium — find competing forces (fluxes/potentials) that produce emergent stability.",
  emergent:
    "Combination creates a new functional domain — identify the phase-transition or bifurcation point neither parent reaches alone.",
  biomimetic:
    "Use a biological structural motif as the merger template — name the organism and the measurable physical principle.",
};

/** Canonical reference hybrids cited in the protocol (not user-saved recipes). */
export const REFERENCE_DESIGNS = [
  {
    id: "vapor-chamber-pcb",
    name: "iPhone vapor chamber × PCB copper plane",
    principle:
      "Heat-pipe topology (two-phase loop) isomorphically mapped to planar copper power distribution — shared Laplace potential field.",
  },
  {
    id: "phononic-heatsink",
    name: "Phononic crystal heatsink",
    principle:
      "Photonic bandgap engineering applied to thermal phonon transport — forbidden frequency bands block heat flux vectors.",
  },
  {
    id: "fractal-pcb",
    name: "Fractal PCB power plane",
    principle:
      "Murray's law venation (biological transport optimization) × power distribution graph — minimizes IR drop under current conservation.",
  },
  {
    id: "magnetocaloric-cooler",
    name: "Magnetocaloric cooler",
    principle:
      "Magnetic Brayton cycle coupled to Stirling recuperator — entropy flux cycles across coupled thermodynamic domains.",
  },
] as const;

/** Required analysis pipeline — every hybrid run must address each step. */
export const ANALYSIS_STEPS = [
  {
    id: "topology-isomorphism",
    title: "Topology isomorphism",
    description:
      "Map parent graphs G_A and G_B; identify node correspondence, shared degree sequences, and spectral invariants.",
  },
  {
    id: "domain-bridging",
    title: "Domain bridging",
    description:
      "Name the governing PDE or transport law unifying both engineering domains; cite isomorphic flux–gradient structure.",
  },
  {
    id: "interface-compatibility",
    title: "Interface compatibility",
    description:
      "Materials (CTE, galvanic, adhesion) or digital contracts (schema, latency, auth) at the boundary.",
  },
  {
    id: "emergent-property",
    title: "Emergent property",
    description:
      "At least one capability impossible in either parent alone — non-additive, falsifiable.",
  },
  {
    id: "falsifiable-tests",
    title: "Falsifiable tests",
    description:
      "requiredCharacterizationTests must be measurable with named instruments, metrics, and pass/fail thresholds.",
  },
] as const;

/** Graph-theoretic invariants used across domain bridges. */
export const GRAPH_INVARIANTS = [
  "degree sequence",
  "spectral gap",
  "algebraic connectivity (Fiedler value)",
  "betweenness centrality at interface nodes",
  "flux conservation at cut sets",
  "potential continuity across matched boundaries",
] as const;

export function matchingDomainBridges(
  domainA: string,
  domainB: string,
): (typeof DOMAIN_BRIDGES)[number][] {
  return DOMAIN_BRIDGES.filter(
    (b) =>
      (b.domains as readonly string[]).includes(domainA) &&
      (b.domains as readonly string[]).includes(domainB),
  );
}

export function pickDomainBridge(
  domainA: string,
  domainB: string,
): (typeof DOMAIN_BRIDGES)[number] {
  const hits = matchingDomainBridges(domainA, domainB);
  if (hits.length > 0) return hits[0];
  return DOMAIN_BRIDGES[DOMAIN_BRIDGES.length - 1];
}
