import type { DanceMove } from "./types";

/** Joint angles (radians) for an illustrative procedural dancer — not motion-capture. */
export type DancePose = {
  hipY: number;
  hipX: number;
  torsoX: number;
  torsoY: number;
  torsoZ: number;
  lShoulderX: number;
  lShoulderZ: number;
  lElbowX: number;
  rShoulderX: number;
  rShoulderZ: number;
  rElbowX: number;
  lHipX: number;
  lKneeX: number;
  rHipX: number;
  rKneeX: number;
  headY: number;
  headX: number;
};

export const NEUTRAL_POSE: DancePose = {
  hipY: 0,
  hipX: 0,
  torsoX: 0,
  torsoY: 0,
  torsoZ: 0,
  lShoulderX: 0.15,
  lShoulderZ: 0.35,
  lElbowX: 0.4,
  rShoulderX: 0.15,
  rShoulderZ: -0.35,
  rElbowX: 0.4,
  lHipX: 0.05,
  lKneeX: 0.1,
  rHipX: 0.05,
  rKneeX: 0.1,
  headY: 0,
  headX: 0,
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPose(a: DancePose, b: DancePose, t: number): DancePose {
  const out = { ...NEUTRAL_POSE };
  (Object.keys(out) as (keyof DancePose)[]).forEach((k) => {
    out[k] = lerp(a[k], b[k], t);
  });
  return out;
}

/**
 * Sample an illustrative dance pose for a move at time `t` (seconds).
 * Shapes read as the named move — not claimed as measured tracking.
 */
export function sampleMovePose(move: DanceMove | undefined, t: number, energy = 0.35): DancePose {
  const p = { ...NEUTRAL_POSE };
  if (!move) {
    const bounce = Math.sin(t * 4) * 0.04;
    p.hipY = bounce;
    p.lKneeX = 0.15 + Math.abs(Math.sin(t * 4)) * 0.1;
    p.rKneeX = 0.15 + Math.abs(Math.cos(t * 4)) * 0.1;
    return p;
  }

  const amp = move.dna.amplitude * (0.7 + energy);
  const freq = move.dna.frequency;
  const phase = t * Math.PI * freq;

  switch (move.id) {
    case "two-step":
    case "cross-step": {
      const side = Math.sin(phase);
      p.hipY = Math.abs(Math.sin(phase * 2)) * 0.06 * amp;
      p.lHipX = side > 0 ? 0.55 * amp : -0.1;
      p.rHipX = side < 0 ? 0.55 * amp : -0.1;
      p.lKneeX = side > 0 ? 0.7 * amp : 0.15;
      p.rKneeX = side < 0 ? 0.7 * amp : 0.15;
      p.torsoY = side * 0.12;
      p.lShoulderZ = 0.4 + side * 0.15;
      p.rShoulderZ = -0.4 - side * 0.15;
      break;
    }
    case "body-roll":
    case "dip-recover": {
      const wave = Math.sin(phase);
      p.torsoX = wave * 0.55 * amp;
      p.hipX = Math.sin(phase - 0.8) * 0.4 * amp;
      p.hipY = Math.sin(phase) * 0.08;
      p.headX = Math.sin(phase + 0.5) * 0.25;
      p.lShoulderX = 0.2 + wave * 0.3;
      p.rShoulderX = 0.2 + wave * 0.3;
      break;
    }
    case "wave-arm": {
      const w = (Math.sin(phase) + 1) / 2;
      p.rShoulderX = -0.2 + w * 1.4 * amp;
      p.rShoulderZ = -0.2 - w * 0.5;
      p.rElbowX = 0.2 + Math.sin(phase * 2) * 1.1 * amp;
      p.lShoulderZ = 0.25;
      p.torsoY = Math.sin(phase) * 0.08;
      break;
    }
    case "charleston": {
      const kick = Math.sin(phase);
      p.rHipX = kick > 0 ? kick * 1.1 * amp : 0.1;
      p.lHipX = kick < 0 ? -kick * 1.1 * amp : 0.1;
      p.rKneeX = kick > 0 ? 0.2 : 0.6;
      p.lKneeX = kick < 0 ? 0.2 : 0.6;
      p.lShoulderX = -kick * 0.6;
      p.rShoulderX = kick * 0.6;
      p.hipY = Math.abs(Math.sin(phase * 2)) * 0.1;
      break;
    }
    case "jack-in":
    case "afro-bounce": {
      const b = Math.abs(Math.sin(phase * 2));
      p.hipY = -b * 0.14 * amp;
      p.lKneeX = 0.25 + b * 0.55 * amp;
      p.rKneeX = 0.25 + b * 0.55 * amp;
      p.torsoX = b * 0.25;
      p.lShoulderX = 0.3 + b * 0.4;
      p.rShoulderX = 0.3 + b * 0.4;
      p.lShoulderZ = 0.55;
      p.rShoulderZ = -0.55;
      break;
    }
    case "heel-toe":
    case "shuffle-glide": {
      const s = Math.sin(phase);
      p.lHipX = 0.15 + s * 0.35;
      p.rHipX = 0.15 - s * 0.35;
      p.torsoZ = s * 0.2;
      p.hipY = Math.sin(phase * 2) * 0.04;
      p.lShoulderZ = 0.45 + s * 0.2;
      p.rShoulderZ = -0.45 - s * 0.2;
      break;
    }
    case "pop-hit":
    case "chest-pop": {
      const hit = Math.pow(Math.max(0, Math.sin(phase * 2)), 8);
      p.torsoX = -hit * 0.45 * amp;
      p.lShoulderX = hit * 0.9;
      p.rShoulderX = hit * 0.9;
      p.lElbowX = 0.5 + hit * 0.6;
      p.rElbowX = 0.5 + hit * 0.6;
      p.hipY = hit * 0.05;
      break;
    }
    case "lock-point": {
      const hold = Math.sin(phase) > 0 ? 1 : 0;
      p.rShoulderX = -0.3 - hold * 0.9;
      p.rShoulderZ = -0.15;
      p.rElbowX = hold * 0.15;
      p.lHipX = 0.25;
      p.torsoY = hold * 0.2;
      p.headY = hold * 0.15;
      break;
    }
    case "floor-sweep": {
      const down = (Math.sin(phase) + 1) / 2;
      p.hipY = -down * 0.55 * amp;
      p.lKneeX = 0.4 + down * 1.2;
      p.rKneeX = 0.3 + down * 0.8;
      p.torsoX = down * 0.7;
      p.lShoulderX = 0.5 + down * 0.6;
      p.rShoulderX = -0.2 + down * 0.4;
      break;
    }
    case "catwalk": {
      const stride = Math.sin(phase);
      p.lHipX = 0.2 + Math.max(0, stride) * 0.7;
      p.rHipX = 0.2 + Math.max(0, -stride) * 0.7;
      p.torsoY = stride * 0.15;
      p.lShoulderZ = 0.2;
      p.rShoulderX = -0.4 + Math.abs(Math.sin(phase * 0.5)) * 0.9;
      p.rElbowX = 0.3;
      p.headY = stride * 0.1;
      break;
    }
    case "freestyle-spin": {
      p.torsoY = phase % (Math.PI * 2);
      p.lShoulderZ = 0.9;
      p.rShoulderZ = -0.9;
      p.lElbowX = 1.2;
      p.rElbowX = 1.2;
      p.lHipX = 0.3 + Math.sin(phase * 2) * 0.2;
      p.rHipX = 0.3 - Math.sin(phase * 2) * 0.2;
      p.hipY = Math.sin(phase * 3) * 0.05;
      break;
    }
    default: {
      const bounce = Math.sin(phase);
      p.hipY = Math.abs(bounce) * 0.08 * amp;
      p.lHipX = 0.2 + bounce * 0.25;
      p.rHipX = 0.2 - bounce * 0.25;
      p.lShoulderX = 0.3 + bounce * 0.35;
      p.rShoulderX = 0.3 - bounce * 0.35;
      p.torsoY = bounce * 0.1;
    }
  }

  return p;
}

/** Cycle through a sequence of moves for choreography preview. */
export function sampleRoutinePose(
  moves: DanceMove[],
  progress01: number,
  t: number,
): { pose: DancePose; activeIndex: number } {
  if (!moves.length) return { pose: sampleMovePose(undefined, t), activeIndex: 0 };
  const idx = Math.min(moves.length - 1, Math.floor(progress01 * moves.length));
  const local = (progress01 * moves.length) % 1;
  const move = moves[idx]!;
  return { pose: sampleMovePose(move, local * move.durationSec + t * 0.15), activeIndex: idx };
}
