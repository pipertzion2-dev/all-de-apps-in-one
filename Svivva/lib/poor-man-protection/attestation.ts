import { createHash, createHmac, randomUUID, randomBytes } from "crypto";
import type {
  ColorSwatch,
  CyberSeal,
  GroupDisclosure,
  PoorManCertificate,
  ProtectionCoin,
  ProtectRequest,
  ScientificAxes,
  TimestampToken,
} from "./types";
import { groupMerkleCanonical } from "./group-organize";
import { buildDigitalScientificAxes } from "./digital-patent";

export const DISCLAIMER =
  "ZZAI Poor Man Protection creates a timestamped, cryptographically sealed evidentiary package with dual-axis scientific hybridization and mint-ready digital asset metadata. It is NOT a registered patent, trademark, or copyright registration with any government office (including the U.S. Copyright Office). Self-mailing and platform certificates are supporting evidence of anteriority/possession — not a substitute for counsel or formal registration. Courts weigh digital evidence in context (hash integrity, chain of custody, independent timestamps, authorship corroboration).";

/** sRGB hex → approximate CIELAB (D65). */
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

function joinInterrogation(parts: Array<string | undefined>, fallback: string): string {
  const filled = parts.map((p) => p?.trim()).filter(Boolean) as string[];
  return filled.length ? filled.join(" · ") : fallback;
}

export function buildScientificAxes(input: ProtectRequest): ScientificAxes {
  if (input.patentKind === "digital" && input.digitalDisclosure) {
    return buildDigitalScientificAxes(input, input.digitalDisclosure);
  }
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

  const formSummary = joinInterrogation(
    [
      input.formVariable,
      input.formInterrogation?.silhouette && `Silhouette: ${input.formInterrogation.silhouette}`,
      input.formInterrogation?.hierarchy && `Hierarchy: ${input.formInterrogation.hierarchy}`,
      input.formInterrogation?.negativeSpace &&
        `Negative space: ${input.formInterrogation.negativeSpace}`,
      input.formInterrogation?.distinctiveMarks &&
        `Marks: ${input.formInterrogation.distinctiveMarks}`,
    ],
    input.formVariable,
  );

  const paletteSummary = joinInterrogation(
    [
      input.paletteVariable,
      input.paletteInterrogation?.emotionalIntent &&
        `Intent: ${input.paletteInterrogation.emotionalIntent}`,
      input.paletteInterrogation?.contrastStrategy &&
        `Contrast: ${input.paletteInterrogation.contrastStrategy}`,
      input.paletteInterrogation?.forbiddenColors &&
        `Forbidden: ${input.paletteInterrogation.forbiddenColors}`,
      input.paletteInterrogation?.lightingContext &&
        `Lighting: ${input.paletteInterrogation.lightingContext}`,
    ],
    input.paletteVariable,
  );

  const measurableClaims = [
    `Form axis A locked as: ${formSummary.slice(0, 220)}`,
    `Spectral axis B locked as: ${paletteSummary.slice(0, 220)}`,
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
      summary: formSummary,
    },
    axisB: {
      name: "color_spectral",
      label: "Color / spectral signature",
      domain: "optical",
      summary: paletteSummary,
      palette,
    },
    couplingPrinciple:
      "Two-variable hybridization: composition geometry (A) couples with spectral palette (B) to define a unique prior-art fingerprint for evidentiary disclosure — the coupling itself is the claimed creative signal.",
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
      { trait_type: "Protocol", value: "ZZAI-Poor-Man-Protection/1.1" },
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
      "Retain original binary offline; never alter sealed originals",
    ],
    securityCenterPath: "/dashboard/security",
    threatScannerPath: "/dashboard/security?tab=scan",
    pqcPath: "/dashboard/security?tab=pqc",
  };
}

/** ZZAI-signed timestamp token (RFC 3161–inspired fields; not a QTSP qualified stamp). */
export function createTimestampToken(contentHash: string): TimestampToken {
  const genTime = new Date().toISOString();
  const serialNumber = randomBytes(8).toString("hex");
  const policy = "1.2.840.113549.1.9.16.2.14.zzai-pmp";
  const secret = process.env.NEXTAUTH_SECRET || process.env.ORBIT_INTERNAL_SECRET || "zzai-pmp";
  const payload = `ZZAI-TST-1|${contentHash}|${genTime}|${serialNumber}|${policy}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return {
    version: "ZZAI-TST-1",
    hashedMessage: contentHash.toLowerCase(),
    genTime,
    serialNumber,
    policy,
    signature,
  };
}

export function finalizeCertificate(
  partial: Omit<
    PoorManCertificate,
    "attestationId" | "certificateHash" | "disclaimer" | "protocol"
  >,
): PoorManCertificate {
  const attestationId = randomUUID();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://zzaizzai.com";
  const body: PoorManCertificate = {
    protocol: "ZZAI-Poor-Man-Protection/1.1",
    disclaimer: DISCLAIMER,
    attestationId,
    certificateHash: "",
    verifyUrl: `${site}/protect/verify?id=${attestationId}`,
    ...partial,
  };
  const { certificateHash: _omit, ...forHash } = body;
  body.certificateHash = createHash("sha256").update(stableStringify(forHash)).digest("hex");
  return body;
}

/** Deterministic JSON for hashing (sorted keys). */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function verifyCertificateHash(cert: PoorManCertificate): boolean {
  const { certificateHash, ...rest } = cert;
  const expected = createHash("sha256").update(stableStringify(rest)).digest("hex");
  return expected === certificateHash;
}

export function merkleRootFromCanonical(canonical: string): string {
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function assertGroupMerkle(disclosure: GroupDisclosure, contentHash: string): void {
  const canonical = groupMerkleCanonical(disclosure.sheets.map((s) => s.contentHash));
  const root = merkleRootFromCanonical(canonical);
  if (root !== disclosure.merkleRoot.toLowerCase() || root !== contentHash.toLowerCase()) {
    throw new Error("Group merkle root does not match deposited sheet hashes.");
  }
  if (disclosure.figureCount !== disclosure.sheets.length) {
    throw new Error("Group figure count does not match the sheet schedule.");
  }
}
