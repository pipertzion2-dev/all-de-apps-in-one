import { z } from "zod";

export const ENGINEERING_DOMAINS = [
  "thermal",
  "electrical",
  "mechanical",
  "rf",
  "optical",
  "fluidic",
  "acoustic",
  "chemical",
  "digital",
  "information",
] as const;

export const TOPOLOGIES = ["star", "mesh", "tree", "ring", "hierarchical"] as const;

export const HYBRIDIZATION_MODES = [
  "complementary",
  "antagonistic",
  "emergent",
  "biomimetic",
] as const;

export const SCIENTIFIC_DEPTHS = ["prototype", "research", "production"] as const;

export const physicalPropertiesSchema = z.object({
  material: z.string().optional(),
  operatingTemp: z.string().optional(),
  powerDensity: z.string().optional(),
  dimensions: z.string().optional(),
  frequencyRange: z.string().optional(),
});

export const schematicSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.enum(ENGINEERING_DOMAINS),
  topology: z.enum(TOPOLOGIES),
  coreComponents: z.array(z.string()).min(1).max(20),
  physicalProperties: physicalPropertiesSchema.optional().default({}),
  constraints: z.array(z.string()).optional().default([]),
  imageBase64: z.string().optional(),
});

export const hybridizationRequestSchema = z.object({
  schematicA: schematicSchema,
  schematicB: schematicSchema,
  hybridizationMode: z.enum(HYBRIDIZATION_MODES).default("emergent"),
  targetApplication: z.string().min(1).max(500),
  scientificDepth: z.enum(SCIENTIFIC_DEPTHS).default("research"),
  /** Which product surface requested the run (for logging / adapters). */
  surface: z
    .enum([
      "hardware",
      "digital",
      "hypothesis",
      "idea-engine",
      "api-builder",
      "research",
      "poor-man-protection",
      "hybrid-lab",
    ])
    .optional()
    .default("hardware"),
});

export type SchematicInput = z.infer<typeof schematicSchema>;
export type HybridizationRequest = z.infer<typeof hybridizationRequestSchema>;
export type HybridizationMode = (typeof HYBRIDIZATION_MODES)[number];
export type ScientificDepth = (typeof SCIENTIFIC_DEPTHS)[number];
export type EngineeringDomain = (typeof ENGINEERING_DOMAINS)[number];

export type HybridDesign = {
  name: string;
  scientificBasis: string;
  topologyDescription: string;
  coreComponents: string[];
  emergentProperties: string[];
  performanceGains: Record<string, string>;
  biomimeticAnalogue?: string;
  manufacturingPathway?: string;
  challenges: string[];
  noveltyScore: number;
  patentLandscape?: string;
  estimatedRnDMonths?: number;
  trlLevel?: number;
  /** Legacy blueprint compatibility */
  title?: string;
  emergentBehavior?: string;
};

export type HybridizationResult = {
  topologicalBridge: string;
  domainBridgingPrinciple: string;
  materialCompatibilityNote: string;
  hybrids: HybridDesign[];
  optimalHybridIndex: number;
  requiredCharacterizationTests: string[];
  referenceDesigns: string[];
  nextSteps: string[];
  scientificProtocolVersion: string;
  surface: string;
};
