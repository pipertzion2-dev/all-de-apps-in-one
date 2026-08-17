import type {
  ColorSwatch,
  GroupImageInput,
  GroupSheet,
  GroupSheetRole,
  OrganizedGroupPatent,
} from "./types";

export const MAX_GROUP_SHEETS = 24;

/** sRGB hex → approximate CIELAB (D65). Local copy so this module stays isomorphic. */
function hexToLab(hex: string): { L: number; a: number; b: number } {
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
  const f = (t: number) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return {
    L: Number((116 * fy - 16).toFixed(2)),
    a: Number((500 * (fx - fy)).toFixed(2)),
    b: Number((200 * (fy - fz)).toFixed(2)),
  };
}

function viewTokens(): RegExp {
  return /(?:^|[\s._-])(front|back|side|left|right|top|bottom|iso|isometric|perspective|detail|closeup|close-up|macro|thumb|thumbnail|preview|cover|hero|overview|elevation|plan|section|rear|oblique)(?:$|[\s._-])/gi;
}

function iterTokens(): RegExp {
  return /(?:^|[\s._-])(v\d+(?:\.\d+)*|rev\d+|r\d+|copy|final|draft|wip|iter(?:ation)?\d*)(?:$|[\s._-])/gi;
}

function altTokens(): RegExp {
  return /(?:^|[\s._-])(alt|alternate|variant|option|var)\d*(?:$|[\s._-])/gi;
}

/** Canonical string hashed to the group merkle root (client WebCrypto or Node sha256). */
export function groupMerkleCanonical(hashes: string[]): string {
  return [...hashes]
    .map((h) => h.toLowerCase())
    .sort()
    .join("\n");
}

export function stemFromFileName(fileName: string): string {
  const base = fileName.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "");
  return base.replace(/[_]+/g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

export function familyKeyFromFileName(fileName: string): string {
  let stem = stemFromFileName(fileName).toLowerCase();
  stem = stem.replace(/\(\d+\)/g, " ");
  stem = stem.replace(iterTokens(), " ");
  stem = stem.replace(altTokens(), " ");
  stem = stem.replace(viewTokens(), " ");
  stem = stem.replace(/\bfig(?:ure)?\s*\d+\b/gi, " ");
  stem = stem.replace(/\b\d{1,3}\b/g, " ");
  stem = stem.replace(/\s+/g, " ").trim();
  return stem || "deposited-collection";
}

export function inferSheetRole(
  fileName: string,
  indexInFamily: number,
  familySize: number,
): GroupSheetRole {
  const n = fileName.toLowerCase();
  if (/(detail|closeup|close-up|macro|crop|zoom)/.test(n)) return "detail";
  if (
    /(front|back|side|left|right|top|bottom|iso|elevation|plan|section|rear|oblique|perspective)/.test(
      n,
    )
  ) {
    return "elevation";
  }
  if (/(alt|alternate|variant|option)/.test(n)) return "alternate";
  if (/(v\d|rev\d|r\d|copy|draft|wip|iter)/.test(n)) return "iteration";
  if (/(cover|hero|overview|thumb|preview)/.test(n) || indexInFamily === 0) return "overview";
  if (familySize === 1) return "overview";
  return "figure";
}

function titleCase(raw: string): string {
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function sheetTitle(fileName: string, role: GroupSheetRole): string {
  const stem = stemFromFileName(fileName);
  if (stem.length >= 2) return titleCase(stem).slice(0, 80);
  return titleCase(role);
}

const ROLE_ORDER: Record<GroupSheetRole, number> = {
  overview: 0,
  elevation: 1,
  figure: 2,
  detail: 3,
  iteration: 4,
  alternate: 5,
};

function dominantHex(palette?: ColorSwatch[]): string | undefined {
  return palette?.[0]?.hex;
}

function deltaE(hexA: string, hexB: string): number {
  const a = hexToLab(hexA);
  const b = hexToLab(hexB);
  return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

function palettesSimilar(a?: ColorSwatch[], b?: ColorSwatch[]): boolean {
  const ha = dominantHex(a);
  const hb = dominantHex(b);
  if (!ha || !hb) return false;
  return deltaE(ha, hb) < 28;
}

function mergePalettes(palettes: ColorSwatch[][]): ColorSwatch[] {
  const buckets = new Map<string, { hex: string; weight: number }>();
  for (const palette of palettes) {
    for (const swatch of palette) {
      const key = swatch.hex.toUpperCase();
      const prev = buckets.get(key);
      const add = swatch.weight || 0.1;
      if (prev) prev.weight += add;
      else buckets.set(key, { hex: swatch.hex.toUpperCase(), weight: add });
    }
  }
  const roles: ColorSwatch["role"][] = ["dominant", "secondary", "accent", "shadow", "highlight"];
  const sorted = [...buckets.values()].sort((x, y) => y.weight - x.weight).slice(0, 5);
  const total = sorted.reduce((s, x) => s + x.weight, 0) || 1;
  return sorted.map((s, i) => ({
    hex: s.hex,
    role: roles[i] || "accent",
    weight: Number((s.weight / total).toFixed(3)),
  }));
}

function hueIntent(palette: ColorSwatch[]): string {
  const hex = dominantHex(palette);
  if (!hex) return "Palette derived from the deposited sheet set";
  const lab = hexToLab(hex);
  if (lab.a > 12 && lab.b > 8) return "Warm, assertive spectral intent (red-gold dominance)";
  if (lab.b < -8) return "Cool, receding spectral intent (blue dominance)";
  if (lab.a < -8) return "Restorative spectral intent (green dominance)";
  if (lab.L > 75) return "High-key, airy spectral intent";
  if (lab.L < 30) return "Low-key, shadowed spectral intent";
  return "Balanced mid-key spectral intent locked from group palettes";
}

function contrastFromPalette(palette: ColorSwatch[]): string {
  if (palette.length < 2)
    return "Single-family palette; contrast claimed across figure sequence rather than one frame";
  const d = deltaE(palette[0].hex, palette[1].hex);
  if (d > 45) return "High perceptual contrast (CIELAB ΔE* > 45 between dominant and secondary)";
  if (d > 22) return "Moderate perceptual contrast across the group fingerprint";
  return "Close-harmony palette; distinction lives in form sequence across figures";
}

type Cluster = { key: string; images: GroupImageInput[] };

function clusterImages(images: GroupImageInput[]): Cluster[] {
  const byKey = new Map<string, GroupImageInput[]>();
  for (const img of images) {
    const key = familyKeyFromFileName(img.fileName);
    const list = byKey.get(key) || [];
    list.push(img);
    byKey.set(key, list);
  }

  const clusters: Cluster[] = [...byKey.entries()].map(([key, imgs]) => ({ key, images: imgs }));

  // Merge leftover singletons into a similar-palette family when names diverged.
  const large = clusters.filter((c) => c.images.length >= 2);
  const singles = clusters.filter((c) => c.images.length === 1);
  if (!singles.length) return sortClusters(clusters);

  const absorbed = new Set<number>();
  for (let i = 0; i < singles.length; i++) {
    const solo = singles[i];
    const target =
      large.find((c) => palettesSimilar(c.images[0]?.palette, solo.images[0]?.palette)) || large[0];
    if (target && palettesSimilar(target.images[0]?.palette, solo.images[0]?.palette)) {
      target.images.push(solo.images[0]);
      absorbed.add(i);
    }
  }

  const remaining = singles.filter((_, i) => !absorbed.has(i));
  return sortClusters([...large, ...remaining]);
}

function sortClusters(clusters: Cluster[]): Cluster[] {
  return [...clusters].sort((a, b) => {
    if (b.images.length !== a.images.length) return b.images.length - a.images.length;
    return a.key.localeCompare(b.key);
  });
}

function orderFamily(images: GroupImageInput[]): GroupImageInput[] {
  return [...images].sort((a, b) => {
    const ra = inferSheetRole(a.fileName, 0, images.length);
    const rb = inferSheetRole(b.fileName, 0, images.length);
    if (ROLE_ORDER[ra] !== ROLE_ORDER[rb]) return ROLE_ORDER[ra] - ROLE_ORDER[rb];
    const ta = a.lastModifiedMs ?? 0;
    const tb = b.lastModifiedMs ?? 0;
    if (ta !== tb) return ta - tb;
    return a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: "base" });
  });
}

function isoDate(ms?: number): string | undefined {
  if (!ms || !Number.isFinite(ms)) return undefined;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Turn a dump of images into one group-patent disclosure:
 * families from filenames, leftover sheets merged by palette, figures numbered,
 * axes and chronology filled so the wizard can skip busywork.
 */
export function organizeGroupPatent(images: GroupImageInput[]): OrganizedGroupPatent {
  if (images.length < 1) {
    throw new Error("Drop at least one image to organize a group patent.");
  }
  const capped = images.slice(0, MAX_GROUP_SHEETS);
  const clusters = clusterImages(capped);

  const sheets: GroupSheet[] = [];
  let fig = 1;
  for (const cluster of clusters) {
    const ordered = orderFamily(cluster.images);
    ordered.forEach((img, idx) => {
      const role = inferSheetRole(img.fileName, idx, ordered.length);
      sheets.push({
        figure: `Fig. ${fig}`,
        fileName: img.fileName.replace(/^.*[/\\]/, "").slice(0, 260),
        contentHash: img.contentHash.toLowerCase(),
        mimeType: img.mimeType || "image/png",
        role,
        title: sheetTitle(img.fileName, role),
        familyKey: cluster.key,
        lastModified: isoDate(img.lastModifiedMs),
        palette: img.palette?.length ? img.palette : undefined,
      });
      fig += 1;
    });
  }

  const hashes = sheets.map((s) => s.contentHash);
  let palette = mergePalettes(capped.map((i) => i.palette || []));
  if (!palette.length) {
    palette = [{ hex: "#5B8DA8", role: "dominant", weight: 1 }];
  }
  const primaryKey = clusters[0]?.key || "deposited-collection";
  const title =
    clusters.length === 1
      ? titleCase(primaryKey)
      : `Group disclosure — ${clusters.map((c) => titleCase(c.key)).join(", ")}`;

  const figureLines = sheets.map((s) => `${s.figure} (${s.role}): ${s.fileName}`).join("; ");

  const description =
    `Automatically organized group patent / multi-figure prior-art disclosure of ${sheets.length} deposited sheet${
      sheets.length === 1 ? "" : "s"
    } across ${clusters.length} visual famil${clusters.length === 1 ? "y" : "ies"}. ` +
    `Figure schedule: ${figureLines}. ` +
    `Each sheet is SHA-256 addressed; the group content hash is the merkle root of those hashes.`;

  const roles = [...new Set(sheets.map((s) => s.role))];
  const formVariable =
    `Multi-figure composition covering ${roles.join(", ")} sheets. ` +
    `Primary overview is ${sheets[0]?.title || "Fig. 1"}; subsequent figures lock elevations, details, and iterations as a single inventive disclosure.`;

  const paletteVariable =
    palette.length > 0
      ? `${hueIntent(palette)}. Fingerprint: ${palette.map((c) => `${c.role}=${c.hex}`).join(", ")}`
      : "Spectral signature to be taken from deposited sheets";

  const times = capped
    .map((i) => i.lastModifiedMs)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const first = times.length ? Math.min(...times) : undefined;
  const last = times.length ? Math.max(...times) : undefined;

  const interrogation = {
    silhouette: `Group silhouette language read across ${sheets.length} figures (${roles.join(", ")}). Lead sheet: ${sheets[0]?.fileName || "Fig. 1"}.`,
    hierarchy:
      "Evidentiary order: overview → elevations → remaining figures → details → iterations → alternates.",
    negativeSpace:
      "Negative space is claimed as consistent across the figure set, not only the hero sheet.",
    distinctiveMarks: `A copyist would need to recreate ${sheets.length} hashed sheets in this organized sequence (family keys: ${clusters.map((c) => c.key).join(", ")}).`,
    emotionalIntent: hueIntent(palette),
    contrastStrategy: contrastFromPalette(palette),
    forbiddenColors:
      "Colors absent from the extracted group fingerprint are treated as deliberately unused.",
    lightingContext:
      "Studio / screen viewing of deposited raster sheets; claims are informational and compositional.",
  };

  return {
    title: title.slice(0, 200),
    description: description.slice(0, 4000),
    formVariable: formVariable.slice(0, 1000),
    paletteVariable: paletteVariable.slice(0, 1000),
    palette,
    sheets,
    familyCount: clusters.length,
    figureCount: sheets.length,
    merkleCanonical: groupMerkleCanonical(hashes),
    chronologyHint: {
      conceivedOn: isoDate(first),
      firstFixedOn: isoDate(last || first),
      medium: "Digital sketch / multi-figure group disclosure",
      iterationNotes: `Auto-organized ${sheets.length} images into ${clusters.length} famil${
        clusters.length === 1 ? "y" : "ies"
      }. ${figureLines}`,
    },
    interrogation,
  };
}
