import { z } from "zod";

export const COLOR_ROLES = ["dominant", "secondary", "accent", "shadow", "highlight"] as const;

export const colorSwatchSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  role: z.enum(COLOR_ROLES),
  weight: z.number().min(0).max(1),
  lab: z
    .object({
      L: z.number(),
      a: z.number(),
      b: z.number(),
    })
    .optional(),
});

export const custodyEventSchema = z.object({
  at: z.string(),
  event: z.string().min(1).max(200),
  detail: z.string().max(1000).optional(),
});

export const chronologySchema = z.object({
  conceivedOn: z.string().max(40).optional(),
  firstFixedOn: z.string().max(40).optional(),
  iterationNotes: z.string().max(2000).optional(),
  collaborators: z.string().max(500).optional(),
  priorDisclosure: z.string().max(1000).optional(),
  medium: z.string().max(200).optional(),
});

export const creatorOathSchema = z.object({
  fullLegalName: z.string().min(2).max(200),
  role: z.enum(["sole_author", "co_author", "assignee", "agent"]).default("sole_author"),
  jurisdiction: z.string().min(2).max(120),
  swornAt: z.string(),
  statement: z.string().min(20).max(2000),
  acknowledgedNotRegisteredPatent: z.literal(true),
  acknowledgedUsCopyrightOffice: z.literal(true),
});

export const protectRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  formVariable: z.string().min(1).max(1000),
  paletteVariable: z.string().min(1).max(1000),
  /** Guided scientific interrogation answers (axis A). */
  formInterrogation: z
    .object({
      silhouette: z.string().max(500).optional(),
      hierarchy: z.string().max(500).optional(),
      negativeSpace: z.string().max(500).optional(),
      distinctiveMarks: z.string().max(500).optional(),
    })
    .optional(),
  /** Guided scientific interrogation answers (axis B). */
  paletteInterrogation: z
    .object({
      emotionalIntent: z.string().max(500).optional(),
      contrastStrategy: z.string().max(500).optional(),
      forbiddenColors: z.string().max(500).optional(),
      lightingContext: z.string().max(500).optional(),
    })
    .optional(),
  palette: z.array(colorSwatchSchema).min(1).max(12).optional(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i),
  mimeType: z.string().max(100).optional().default("image/png"),
  fileName: z.string().max(260).optional(),
  imageBase64: z.string().max(2_500_000).optional(),
  hybridizationMode: z
    .enum(["complementary", "antagonistic", "emergent", "biomimetic"])
    .optional()
    .default("emergent"),
  enableCyberSeal: z.boolean().optional().default(true),
  mintCoin: z.boolean().optional().default(true),
  chronology: chronologySchema.optional(),
  creatorOath: creatorOathSchema.optional(),
  custodyLog: z.array(custodyEventSchema).max(40).optional(),
  delivery: z
    .object({
      emailTo: z.string().email().optional(),
      counselEmail: z.string().email().optional(),
      includePostalInstructions: z.boolean().optional().default(true),
    })
    .optional(),
});

export type ColorSwatch = z.infer<typeof colorSwatchSchema>;
export type ProtectRequest = z.infer<typeof protectRequestSchema>;
export type CreatorOath = z.infer<typeof creatorOathSchema>;
export type Chronology = z.infer<typeof chronologySchema>;
export type CustodyEvent = z.infer<typeof custodyEventSchema>;

export type ProtectionCoin = {
  name: string;
  symbol: string;
  tokenId: string;
  contractAddress: string;
  standard: "ZZAI-PMP-721";
  chain: "zzai-protection-ledger";
  decimals: 0;
  supply: 1;
  metadataUriHint: string;
  attributes: Array<{ trait_type: string; value: string }>;
};

export type CyberSeal = {
  algorithm: "SHA-256";
  contentHash: string;
  sealHash: string;
  sealedAt: string;
  integrity: "sealed";
  watchHints: string[];
  securityCenterPath: "/dashboard/security";
  threatScannerPath: "/dashboard/security?tab=scan";
  pqcPath: "/dashboard/security?tab=pqc";
};

export type ScientificAxes = {
  axisA: {
    name: "form_composition";
    label: string;
    domain: "optical" | "mechanical" | "information";
    summary: string;
  };
  axisB: {
    name: "color_spectral";
    label: string;
    domain: "optical" | "information";
    summary: string;
    palette?: ColorSwatch[];
  };
  couplingPrinciple: string;
  measurableClaims: string[];
};

/** Independent-style timestamp token (ZZAI-signed; not a QTSP eIDAS stamp). */
export type TimestampToken = {
  version: "ZZAI-TST-1";
  hashedMessage: string;
  genTime: string;
  serialNumber: string;
  policy: string;
  signature: string;
};

export type PoorManCertificate = {
  protocol: "ZZAI-Poor-Man-Protection/1.1";
  disclaimer: string;
  createdAt: string;
  title: string;
  description: string;
  contentHash: string;
  mimeType: string;
  fileName?: string;
  scientificAxes: ScientificAxes;
  hybridization: {
    usedEngine: boolean;
    topologicalBridge: string;
    domainBridgingPrinciple: string;
    patentLandscape?: string;
    noveltyScore: number;
    emergentClaims: string[];
    optimalHybridName?: string;
  };
  coin?: ProtectionCoin;
  cyberSeal?: CyberSeal;
  timestampToken?: TimestampToken;
  chronology?: Chronology;
  creatorOath?: CreatorOath;
  custodyLog?: CustodyEvent[];
  attestationId: string;
  certificateHash: string;
  verifyUrl?: string;
};
