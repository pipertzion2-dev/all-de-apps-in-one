import { createHash, createHmac, randomUUID } from "crypto";
import type {
  ColorSwatch,
  CyberSeal,
  PoorManCertificate,
  ProtectionCoin,
  ProtectRequest,
  ScientificAxes,
} from "./types";

export const DISCLAIMER =
  "Poor Man Protection creates a timestamped, cryptographically sealed evidentiary package and mint-ready digital asset metadata. It is not a registered patent, trademark, or copyright filing with any government office. Consult IP counsel for formal protection.";

/** sRGB hex → approximate CIELAB (D65) for scientific palette claims. */
export function hexToLab(hex: string): { L: number; a: number; b: number } {
  const h = hex.replace("#", "");
  let r = parseInt(h.slice(0, 2), 16) / 255;
  let g = parseInt(h.slice(2, 4), 16) / 255;
  let b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  r = lin(r);
  g = lin(g);
  b = lin(b);
  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) / 1.0;
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return {
    L: Number((116 * fy - 16).toFixed(2)),
    a: Number((500 * (fx - fy)).toFixed(2)),
    b: Number((200 * (fy - fz)).toFixed(2)),
  };
}

export function enrichPalette(palette: ColorSwatch[]): ColorSwatch[] {
  return palette.map((swatch) => ({
    ...swatch,
    lab: swatch.lab || hexToLab(swatch.hex),
  }));
}

export function buildScientificAxes(input: ProtectRequest): ScientificAxes {
  const palette = input.palette ? enrichPalette(input.palette) : undefined;
  const dominant = palette?.[0];
  const accent = palette?.find((p) => p.role === "accent") || palette?.[1];
  const deltaE =
    dominant?.lab && accent?.lab
      ? Number(
          Math.sqrt(
            (dominant.lab.L - accent.lab.L) ** 2 +
              (dominant.lab.a - accent.lab.a) ** 2 +
              (dominant.lab.b - accent.lab.b) ** 2,
          ).toFixed(2),
        )
      : null;

  const measurableClaims = [
    `Form axis A locked as: ${input.formVariable.slice(0, 160)}`,
    `Spectral axis B locked as: ${input.paletteVariable.slice(0, 160)}`,
  ];
  if (palette?.length) {
    measurableClaims.push(
      `Palette fingerprint: ${palette.map((p) => `${p.role}=${p.hex}`).join(", ")}`,
    );
  }
  if (deltaE != null) {
    measurableClaims.push(
      `CIELAB ΔE* between dominant and accent ≈ ${deltaE} (perceptual separation claim)`,
    );
  }

  return {
    axisA: {
      name: "form_composition",
      label: "Form / composition",
      domain: "optical",
      summary: input.formVariable,
    },
    axisB: {
      name: "color_spectral",
      label: "Color / spectral signature",
      domain: "optical",
      summary: input.paletteVariable,
      palette,
    },
    couplingPrinciple:
      "Two-variable hybridization: composition geometry (A) couples with spectral palette (B) to define a unique prior-art fingerprint for evidentiary disclosure.",
    measurableClaims,
  };
}

export function mintProtectionCoin(
  input: ProtectRequest,
  axes: ScientificAxes,
  noveltyScore: number,
): ProtectionCoin {
  const seed = createHash("sha256")
    .update(`zzai-pmp-coin:${input.contentHash}:${input.title}`)
    .digest("hex");
  const contractAddress = `0x${seed.slice(0, 40)}`;
  const tokenId = BigInt(`0x${seed.slice(40, 56)}`).toString(10);
  const words = input.title
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const symbol = (
    words.length >= 2
      ? words
          .slice(0, 3)
          .map((w) => w[0])
          .join("")
      : input.title.slice(0, 4)
  )
    .toUpperCase()
    .padEnd(3, "Z")
    .slice(0, 5);

  return {
    name: `${input.title} Protection Coin`,
    symbol,
    tokenId,
    contractAddress,
    standard: "ZZAI-PMP-721",
    chain: "zzai-protection-ledger",
    decimals: 0,
    supply: 1,
    metadataUriHint: `zzai://poor-man-protection/${input.contentHash.slice(0, 16)}`,
    attributes: [
      { trait_type: "Protocol", value: "ZZAI-Poor-Man-Protection/1.0" },
      { trait_type: "ContentHash", value: input.contentHash },
      { trait_type: "NoveltyScore", value: String(noveltyScore) },
      { trait_type: "AxisA", value: axes.axisA.label },
      { trait_type: "AxisB", value: axes.axisB.label },
      ...(axes.axisB.palette?.slice(0, 5).map((p) => ({
        trait_type: `Palette_${p.role}`,
        value: p.hex,
      })) || []),
    ],
  };
}

export function createCyberSeal(contentHash: string): CyberSeal {
  const sealedAt = new Date().toISOString();
  const secret = process.env.NEXTAUTH_SECRET || process.env.ORBIT_INTERNAL_SECRET || "zzai-pmp";
  const sealHash = createHmac("sha256", secret)
    .update(`cyber-seal:${contentHash}:${sealedAt}`)
    .digest("hex");

  return {
    algorithm: "SHA-256",
    contentHash,
    sealHash,
    sealedAt,
    integrity: "sealed",
    watchHints: [
      "Monitor for copycat uploads with matching content hash",
      "Watch social/feed mentions of the protection coin symbol",
      "Re-seal after any material revision (new hash = new prior art package)",
    ],
    securityCenterPath: "/dashboard/security",
    threatScannerPath: "/dashboard/security?tab=scan",
    pqcPath: "/dashboard/security?tab=pqc",
  };
}

export function finalizeCertificate(
  partial: Omit<
    PoorManCertificate,
    "attestationId" | "certificateHash" | "disclaimer" | "protocol"
  >,
): PoorManCertificate {
  const attestationId = randomUUID();
  const body: PoorManCertificate = {
    protocol: "ZZAI-Poor-Man-Protection/1.0",
    disclaimer: DISCLAIMER,
    attestationId,
    certificateHash: "",
    ...partial,
  };
  const { certificateHash: _omit, ...forHash } = body;
  body.certificateHash = createHash("sha256").update(JSON.stringify(forHash)).digest("hex");
  return body;
}

export function verifyCertificateHash(cert: PoorManCertificate): boolean {
  const { certificateHash, ...rest } = cert;
  const expected = createHash("sha256").update(JSON.stringify(rest)).digest("hex");
  return expected === certificateHash;
}
