/**
 * Automated manufacturing plan generator for hybridized hardware.
 * Produces flagship-grade (e.g. smartphone vapor-chamber class) BOM,
 * process steps, DFM gates, supplier classes, cost bands, and qualification.
 */

import type {
  HybridDomain,
  HybridizationMode,
  SchematicInput,
  ScientificDepth,
} from "./scientific-engine";

export type BomLine = {
  part: string;
  material: string;
  process: string;
  qty: string;
  tolerance: string;
  notes: string;
};

export type ProcessStep = {
  step: number;
  name: string;
  equipment: string;
  duration: string;
  criticalParams: string[];
  exitCriteria: string;
};

export type SupplierClass = {
  role: string;
  examples: string[];
  region: string;
  moqHint: string;
  leadTime: string;
};

export type ManufacturePlan = {
  planVersion: "2.0";
  productCodename: string;
  class: "flagship-consumer" | "industrial" | "research-coupon" | "modular-adapter";
  summary: string;
  targetFormFactor: string;
  thermalElectricalEnvelope: string;
  bom: BomLine[];
  processFlow: ProcessStep[];
  dfmGates: string[];
  supplierClasses: SupplierClass[];
  costModel: {
    nreUsd: string;
    unitCostBandUsd: string;
    toolingUsd: string;
    yieldTarget: string;
    rampMonths: number;
  };
  qualification: string[];
  factoryFloorLayoutHints: string[];
  ipChecklist: string[];
};

function isThermalFluidic(a: HybridDomain, b: HybridDomain) {
  const s = new Set([a, b]);
  return s.has("thermal") && (s.has("fluidic") || s.has("electrical") || s.has("mechanical"));
}

function looksLikeVaporChamber(a: SchematicInput, b: SchematicInput, target: string) {
  const blob = `${a.name} ${b.name} ${a.coreComponents.join(" ")} ${b.coreComponents.join(" ")} ${target}`.toLowerCase();
  return /vapor|chamber|heat.?pipe|cooling|graphite|soc|iphone|smartphone|pro.?max|spread|wick|two-?phase/.test(
    blob,
  );
}

/** Build a production-grade automated manufacture plan from hybrid context. */
export function buildManufacturePlan(opts: {
  schematicA: SchematicInput;
  schematicB: SchematicInput;
  hybridizationMode: HybridizationMode;
  targetApplication: string;
  scientificDepth: ScientificDepth;
  viability: number;
  novelty: number;
  risk: number;
}): ManufacturePlan {
  const { schematicA: a, schematicB: b, targetApplication, scientificDepth: depth, viability, novelty, risk } =
    opts;
  const flagshipVc = looksLikeVaporChamber(a, b, targetApplication) || isThermalFluidic(a.domain, b.domain);
  const production = depth === "production" || flagshipVc;

  const productCodename = flagshipVc
    ? `VC-FLAGSHIP-${a.domain.slice(0, 2).toUpperCase()}${b.domain.slice(0, 2).toUpperCase()}`
    : `HYB-${a.domain.slice(0, 3).toUpperCase()}-${b.domain.slice(0, 3).toUpperCase()}`;

  const targetFormFactor = flagshipVc
    ? "Ultra-thin planar envelope ≤0.4–0.6 mm Z-height, conforming to SoC / mid-frame / graphite stack (Pro Max class)"
    : `Integrated ${a.domain}–${b.domain} module sized for: ${targetApplication.slice(0, 80)}`;

  const thermalElectricalEnvelope = flagshipVc
    ? "Steady 8–15 W SoC burst with vapor-chamber effective conductivity ≫ bulk Cu; keep skin ΔT within handset UX limits; electrical plane isolation ≥10⁸ Ω where required"
    : `Coupled ${a.domain}/${b.domain} envelope sized from parent physicalProperties and target loads`;

  const bom: BomLine[] = flagshipVc
    ? [
        {
          part: "Evaporator / condenser Cu shell",
          material: "C1100 / OFHC copper, 0.1–0.15 mm",
          process: "Precision stamping + diffusion / laser weld seal",
          qty: "2 shells / unit",
          tolerance: "±15 µm flatness over SoC footprint",
          notes: "Match CTE to mid-frame; Ni flash optional for corrosion",
        },
        {
          part: "Sintered / mesh wick structure",
          material: "Cu powder sinter or woven Cu mesh",
          process: "Powder sinter in H₂ / vacuum furnace",
          qty: "1 wick map",
          tolerance: "Porosity 40–55%; pore Ø tuned to working fluid",
          notes: "Gradient wick thickness under hot spot",
        },
        {
          part: "Working fluid charge",
          material: "DI water (degassed) or engineered fluid",
          process: "Vacuum charge + pinch-off / laser seal",
          qty: "µL-scale charge",
          tolerance: "Fill ratio per thermal model ±5%",
          notes: "Leak rate <1e-9 mbar·L/s class for flagship",
        },
        {
          part: "TIM / graphite spreader interface",
          material: "High-k graphite sheet + phase-change / gel TIM",
          process: "Kiss-cut lamination + automated place",
          qty: "1–2 layers",
          tolerance: "Bond-line thickness controlled ±20 µm",
          notes: "Avoid air voids under SoC die",
        },
        {
          part: "Electrical / structural interposer",
          material: a.domain === "electrical" || b.domain === "electrical" ? "Cu PCB / FPC" : "Al/Mg mid-frame insert",
          process: "SMT + selective conformal / CNC",
          qty: "1",
          tolerance: "IPC Class 2/3 as applicable",
          notes: "Keep return paths clear of vapor core crush zones",
        },
        {
          part: "Support pillars / anti-collapse posts",
          material: "Cu or stainless micro-pillars",
          process: "Etch / plate / additive",
          qty: "Array under crush risk zones",
          tolerance: "Height match chamber gap ±10 µm",
          notes: "Critical for drop/press reliability on Pro Max class",
        },
      ]
    : [
        {
          part: `${a.name} primary stack`,
          material: a.physicalProperties?.material || "TBD alloy/polymer",
          process: "Parent-domain primary process",
          qty: "1",
          tolerance: "Per ICD",
          notes: a.coreComponents.slice(0, 3).join(", "),
        },
        {
          part: `${b.name} secondary stack`,
          material: b.physicalProperties?.material || "TBD",
          process: "Parent-domain primary process",
          qty: "1",
          tolerance: "Per ICD",
          notes: b.coreComponents.slice(0, 3).join(", "),
        },
        {
          part: "Multi-physics interface layer",
          material: "CTE-matched interposer / barrier",
          process: "Bond / sinter / adhesive cure",
          qty: "1",
          tolerance: "Interface coplanarity per risk score",
          notes: `Risk index context: ${risk}`,
        },
      ];

  const processFlow: ProcessStep[] = flagshipVc
    ? [
        {
          step: 1,
          name: "Shell blanking & cleaning",
          equipment: "Progressive die + ultrasonic clean line",
          duration: "0.5–1 day lot",
          criticalParams: ["oil-free surface", "burr <10 µm"],
          exitCriteria: "AOI pass + particle count",
        },
        {
          step: 2,
          name: "Wick sinter / pattern",
          equipment: "Vacuum / H₂ sinter furnace",
          duration: "4–12 h cycle",
          criticalParams: ["sinter profile", "porosity"],
          exitCriteria: "Mercury porosimetry / coupon k_eff",
        },
        {
          step: 3,
          name: "Assembly, evacuate, charge, seal",
          equipment: "Vacuum charge station + laser welder",
          duration: "inline cell",
          criticalParams: ["vacuum base pressure", "charge mass", "seal integrity"],
          exitCriteria: "Helium leak + mass check",
        },
        {
          step: 4,
          name: "Thermal performance screen",
          equipment: "Thermal test nest + IR / TC logger",
          duration: "seconds–minutes / unit",
          criticalParams: ["Rth", "hot-spot ΔT", "orientation sensitivity"],
          exitCriteria: "Within flagship bin limits",
        },
        {
          step: 5,
          name: "System integration (mid-frame / graphite / SoC)",
          equipment: "Automated TIM place + press fixture",
          duration: "SMT-adjacent cell",
          criticalParams: ["bond-line", "crush load"],
          exitCriteria: "X-ray / ultrasonic void %",
        },
        {
          step: 6,
          name: "Reliability sample flow",
          equipment: "Thermal cycle, drop, press, humidity",
          duration: "lot sampling",
          criticalParams: ["leak after stress", "ΔRth drift"],
          exitCriteria: "AQL per PPAP",
        },
      ]
    : [
        {
          step: 1,
          name: "ICD lock & DFM",
          equipment: "CAD / PLM",
          duration: "1–2 weeks",
          criticalParams: ["interfaces", "tolerances"],
          exitCriteria: "Signed ICD",
        },
        {
          step: 2,
          name: "Prototype hybrid coupon",
          equipment: "Lab fab + benchtop metrology",
          duration: "2–6 weeks",
          criticalParams: ["join integrity"],
          exitCriteria: "Coupled-domain bench pass",
        },
        {
          step: 3,
          name: "Pilot tooling",
          equipment: "Soft tools / CNC",
          duration: "4–10 weeks",
          criticalParams: ["yield"],
          exitCriteria: "Pilot yield ≥ target-20pp",
        },
        {
          step: 4,
          name: "Production ramp",
          equipment: "Hard tools + inline test",
          duration: `${production ? 3 : 6}+ months`,
          criticalParams: ["CpK", "scrap"],
          exitCriteria: "PPAP / FAI",
        },
      ];

  const dfmGates = flagshipVc
    ? [
        "Z-height stack-up closed with mid-frame + battery + display tolerances",
        "Chamber crush / drop FEA with pillar map",
        "Working-fluid chemical compatibility with seal metals",
        "Electrical isolation from grounded chassis where required",
        "Graphite / TIM rework path without destroying chamber seal",
        "Supplier process capability (Cpk ≥ 1.33) on seal & charge",
      ]
    : [
        "Interface CTE & galvanic review",
        "Serviceability / rework path",
        "EMI / thermal / fluid cross-talk budget",
        "Test coverage for emergent metrics",
      ];

  const supplierClasses: SupplierClass[] = flagshipVc
    ? [
        {
          role: "Vapor chamber / heat pipe OEM",
          examples: ["Asia thermal specialists (Auras, Celsia-class, Furukawa-class peers)", "Tier-1 handset thermal suppliers"],
          region: "TW / CN / JP / KR",
          moqHint: "10k–100k for consumer ramp; engineering lots 50–500",
          leadTime: "4–10 weeks NPI; 8–14 weeks mass",
        },
        {
          role: "Graphite / TIM converter",
          examples: ["Panasonic / Knürr-class graphite converters", "Specialty TIM converters"],
          region: "Global",
          moqHint: "Rolls / kiss-cut panels",
          leadTime: "2–6 weeks",
        },
        {
          role: "Precision stamping / laser seal",
          examples: ["Precision metal stampers with vacuum expertise"],
          region: "Asia + EU specialty",
          moqHint: "Tooling amortised over ≥50k",
          leadTime: "Tooling 6–12 weeks",
        },
        {
          role: "CM / handset JDMer",
          examples: ["Foxconn / Pegatron / Compal-class integrators"],
          region: "CN / VN / IN",
          moqHint: "Program-level",
          leadTime: "Program schedule driven",
        },
      ]
    : [
        {
          role: `${a.domain} specialist fab`,
          examples: ["Domain-matched contract manufacturers"],
          region: "Match parent supply base",
          moqHint: "Pilot 100–1k",
          leadTime: "4–12 weeks",
        },
        {
          role: `${b.domain} specialist fab`,
          examples: ["Domain-matched contract manufacturers"],
          region: "Match parent supply base",
          moqHint: "Pilot 100–1k",
          leadTime: "4–12 weeks",
        },
        {
          role: "System integrator / CM",
          examples: ["EMS with multiphysics test capability"],
          region: "Global",
          moqHint: "NPI kits",
          leadTime: "6–14 weeks",
        },
      ];

  const costModel = flagshipVc
    ? {
        nreUsd: "$250k–$1.2M (tools, fixtures, thermal models, qual)",
        unitCostBandUsd: viability >= 70 ? "$2.5–$6 / chamber at 500k+" : "$4–$12 / early ramp",
        toolingUsd: "$80k–$400k progressive + charge cell",
        yieldTarget: "≥97% after thermal screen at mature ramp",
        rampMonths: novelty >= 70 ? 9 : 6,
      }
    : {
        nreUsd: depth === "production" ? "$80k–$400k" : "$15k–$80k",
        unitCostBandUsd: "Depends on BOM — estimate after ICD lock",
        toolingUsd: depth === "production" ? "$40k–$200k" : "$5k–$40k soft tools",
        yieldTarget: depth === "production" ? "≥95%" : "lab N/A",
        rampMonths: depth === "production" ? 6 : 3,
      };

  const qualification = flagshipVc
    ? [
        "JEDEC-style thermal cycle + biased humidity on system samples",
        "Drop / tumble / press (chamber crush) per handset program",
        "Orientation & g-load two-phase performance map",
        "Long-term leak / non-condensable gas growth monitor",
        "EMI / ESD co-existence with chassis ground strategy",
        "Field return RMA thermal bin correlation",
      ]
    : [
        "Coupled-domain characterization matrix",
        "Environmental stress screen appropriate to class",
        "Interface adhesion / fatigue",
        "Safety / regulatory as applicable",
      ];

  return {
    planVersion: "2.0",
    productCodename,
    class: flagshipVc ? "flagship-consumer" : depth === "research" ? "research-coupon" : "industrial",
    summary: flagshipVc
      ? `Automated flagship vapor-chamber-class hybrid of "${a.name}" × "${b.name}" for ${targetApplication}. Targets Pro Max–level thin two-phase cooling with manufacturable wick/seal/charge and system TIM stack.`
      : `Automated manufacture plan for ${a.domain}–${b.domain} hybrid (${opts.hybridizationMode}) aimed at ${targetApplication}.`,
    targetFormFactor,
    thermalElectricalEnvelope,
    bom,
    processFlow,
    dfmGates,
    supplierClasses,
    costModel,
    qualification,
    factoryFloorLayoutHints: flagshipVc
      ? [
          "Clean charge/seal cell upstream of final assembly",
          "Inline thermal nest adjacent to SMT for fast feedback",
          "Quarantine for leak-fail units with root-cause station",
        ]
      : ["Separate wet/thermal/electrical cells as domains require", "Shared ICD metrology bench"],
    ipChecklist: [
      "FTO on wick geometry, pillar map, and charge method",
      "Avoid copying competitor chamber silhouette patents",
      "File provisional on emergent interface topology if novelty high",
    ],
  };
}

/** Flagship presets — one click to Pro Max–class cool chamber hybridization. */
export const FLAGSHIP_PRESETS = [
  {
    id: "iphone-17-promax-vc",
    title: "iPhone 17 Pro Max–class cool chamber",
    blurb: "Vapor chamber × graphite/PCB power plane — flagship thin cooling",
    systemA: {
      name: "Ultra-thin vapor chamber",
      description:
        "OFHC copper two-phase vapor chamber with sintered wick, micro-pillars, DI water charge, ≤0.4mm Z-height for smartphone SoC hot-spot spreading",
    },
    systemB: {
      name: "Graphite + PCB power plane stack",
      description:
        "High-k graphite spreader laminated to hierarchical Cu PCB/FPC power delivery under SoC, with TIM and chassis thermal vias",
    },
    target: "iPhone 17 Pro Max–class flagship smartphone cool chamber + power delivery",
    mode: "complementary" as const,
    depth: "production" as const,
  },
  {
    id: "phononic-heatsink",
    title: "Phononic crystal heatsink",
    blurb: "Photonic bandgap ideas applied to phonon heat steering",
    systemA: {
      name: "Phononic crystal lattice",
      description: "Periodic elastic metamaterial for engineered phonon dispersion and directional heat flow",
    },
    systemB: {
      name: "Pinned-fin copper heatsink",
      description: "Conventional forced-convection Cu heatsink with pin-fin array",
    },
    target: "High-density AI accelerator cold plate with directed heat extraction",
    mode: "emergent" as const,
    depth: "research" as const,
  },
  {
    id: "sma-connector",
    title: "SMA self-healing connector",
    blurb: "Shape-memory + electrical contact physics",
    systemA: {
      name: "SMA actuator contact",
      description: "NiTi shape memory alloy thermomechanical cycle for contact re-close after fault heat",
    },
    systemB: {
      name: "High-current electrical connector",
      description: "Spring-finger power connector with plating stack for low milliohm contact",
    },
    target: "Fault-tolerant EV / robotics power interconnect",
    mode: "biomimetic" as const,
    depth: "prototype" as const,
  },
] as const;
