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

export const protectRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  /** Form / composition variable (scientific axis A). */
  formVariable: z.string().min(1).max(1000),
  /** Color / spectral variable (scientific axis B) — free text or structured. */
  paletteVariable: z.string().min(1).max(1000),
  palette: z.array(colorSwatchSchema).min(1).max(12).optional(),
  /** SHA-256 hex of the raw sketch bytes (client-computed). */
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i),
  mimeType: z.string().max(100).optional().default("image/png"),
  fileName: z.string().max(260).optional(),
  /** Optional downsized sketch for hybridization vision (base64, no data: prefix). */
  imageBase64: z.string().max(2_500_000).optional(),
  hybridizationMode: z
    .enum(["complementary", "antagonistic", "emergent", "biomimetic"])
    .optional()
    .default("emergent"),
  enableCyberSeal: z.boolean().optional().default(true),
  mintCoin: z.boolean().optional().default(true),
});

export type ColorSwatch = z.infer<typeof colorSwatchSchema>;
export type ProtectRequest = z.infer<typeof protectRequestSchema>;

export type ProtectionCoin = {
  name: string;
  symbol: string;
  tokenId: string;
  /** Deterministic mint-ready address (not yet on a public L1 unless exported). */
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

export type PoorManCertificate = {
  protocol: "ZZAI-Poor-Man-Protection/1.0";
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
  attestationId: string;
  certificateHash: string;
};
