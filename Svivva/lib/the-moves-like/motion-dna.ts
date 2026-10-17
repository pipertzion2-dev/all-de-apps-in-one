import type { DanceMove, MotionDnaParams } from "./types";
import { MOVES_LIKE_HEX } from "./brand";

/** Mulberry32 — deterministic PRNG for illustrative DNA geometry. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export type DnaPoint = { x: number; y: number; z: number };

export type DnaSculptureData = {
  curves: DnaPoint[][];
  particles: DnaPoint[];
  rings: { radius: number; y: number; tilt: number }[];
  color: number;
  label: "illustrative";
  measured: false;
  moveIds: string[];
};

const COLOR_MAP: Record<MotionDnaParams["colorBias"], number> = {
  teal: MOVES_LIKE_HEX.primary,
  magenta: MOVES_LIKE_HEX.secondary,
  mauve: MOVES_LIKE_HEX.tertiary,
  cyan: MOVES_LIKE_HEX.highlight,
};

/** Build illustrative 3D fingerprint paths from move DNA params (not tracking data). */
export function buildIllustrativeDna(
  moves: DanceMove[],
  quality: "low" | "medium" | "high" = "medium",
): DnaSculptureData {
  const segments = quality === "high" ? 64 : quality === "medium" ? 40 : 24;
  const particleCount = quality === "high" ? 180 : quality === "medium" ? 90 : 40;
  const curves: DnaPoint[][] = [];
  const particles: DnaPoint[] = [];
  const rings: DnaSculptureData["rings"] = [];

  if (moves.length === 0) {
    return {
      curves: [],
      particles: [],
      rings: [],
      color: MOVES_LIKE_HEX.primary,
      label: "illustrative",
      measured: false,
      moveIds: [],
    };
  }

  moves.forEach((move, mi) => {
    const { dna } = move;
    const rand = mulberry32(dna.seed + mi * 97);
    const curve: DnaPoint[] = [];
    const lane = (mi - (moves.length - 1) / 2) * 0.55;

    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      const angle = t * Math.PI * 2 * dna.frequency + dna.twist * Math.PI;
      const accent = dna.rhythmAccent[i % dna.rhythmAccent.length] ?? 0.5;
      const amp = dna.amplitude * (0.6 + accent * 0.8);
      const wobble = (rand() - 0.5) * dna.asymmetry * 0.35;
      curve.push({
        x: Math.cos(angle) * amp + lane + wobble,
        y: (t - 0.5) * 2.4 + Math.sin(angle * 1.5) * amp * 0.35,
        z: Math.sin(angle) * amp * (0.7 + dna.asymmetry * 0.4) + wobble * 0.5,
      });
    }
    curves.push(curve);

    for (let p = 0; p < Math.floor(particleCount / moves.length); p++) {
      const t = rand();
      const idx = Math.min(segments - 2, Math.floor(t * (segments - 1)));
      const a = curve[idx]!;
      const b = curve[idx + 1]!;
      const u = rand();
      particles.push({
        x: a.x + (b.x - a.x) * u + (rand() - 0.5) * 0.15,
        y: a.y + (b.y - a.y) * u + (rand() - 0.5) * 0.15,
        z: a.z + (b.z - a.z) * u + (rand() - 0.5) * 0.15,
      });
    }

    rings.push({
      radius: 0.35 + dna.amplitude * 0.5 + mi * 0.08,
      y: -0.9 + mi * 0.35,
      tilt: dna.twist * 0.4,
    });
  });

  const primaryBias = moves[0]?.dna.colorBias ?? "teal";
  return {
    curves,
    particles,
    rings,
    color: COLOR_MAP[primaryBias],
    label: "illustrative",
    measured: false,
    moveIds: moves.map((m) => m.id),
  };
}

/** Blend two DNA params for transition previews (still illustrative). */
export function blendDna(a: MotionDnaParams, b: MotionDnaParams, t: number): MotionDnaParams {
  const mix = (x: number, y: number) => x + (y - x) * t;
  return {
    seed: Math.round(mix(a.seed, b.seed)),
    amplitude: mix(a.amplitude, b.amplitude),
    frequency: mix(a.frequency, b.frequency),
    twist: mix(a.twist, b.twist),
    asymmetry: mix(a.asymmetry, b.asymmetry),
    jointEmphasis: t < 0.5 ? a.jointEmphasis : b.jointEmphasis,
    rhythmAccent: t < 0.5 ? a.rhythmAccent : b.rhythmAccent,
    colorBias: t < 0.5 ? a.colorBias : b.colorBias,
    measured: false,
    label: "illustrative",
  };
}
