"use client";

import { useId } from "react";
import { BUNDLE_CUBE_FACE_URLS } from "@/lib/clean-sneaks/assets";

type HomepageBundlePuzzleProps = {
  className?: string;
  /** Fired when the user activates the puzzle (tap / Enter / Space). */
  onActivate?: () => void;
};

type Edge = "flat" | "out" | "in";

type PieceSpec = {
  label: string;
  col: 0 | 1 | 2;
  row: 0 | 1;
  top: Edge;
  right: Edge;
  bottom: Edge;
  left: Edge;
};

/** Tab radius in objectBoundingBox units (piece local 0–1). */
const TAB = 0.18;
const HALF = TAB / 2;

/**
 * Interlocking 3×2 board — outward/inward tabs mate across shared edges.
 * Each tile shows one full CD-jewel collage (not a crop of a single image).
 */
const PIECES: PieceSpec[] = [
  { label: "ibPw 1", col: 0, row: 0, top: "flat", right: "out", bottom: "out", left: "flat" },
  { label: "ibPw 2", col: 1, row: 0, top: "flat", right: "out", bottom: "in", left: "in" },
  { label: "ibPw 3", col: 2, row: 0, top: "flat", right: "flat", bottom: "out", left: "in" },
  { label: "ibPw 4", col: 0, row: 1, top: "in", right: "in", bottom: "flat", left: "flat" },
  { label: "ibPw 5", col: 1, row: 1, top: "out", right: "in", bottom: "flat", left: "out" },
  { label: "ibPw 6", col: 2, row: 1, top: "in", right: "flat", bottom: "flat", left: "out" },
];

function horizontalBump(y: number, travelingRight: boolean, edge: Edge): string {
  if (edge === "flat") return travelingRight ? `L 1 ${y}` : `L 0 ${y}`;
  const mid = 0.5;
  const depth = TAB * (edge === "out" ? (y < 0.5 ? -1 : 1) : y < 0.5 ? 1 : -1);
  if (travelingRight) {
    const a = mid - HALF;
    const b = mid + HALF;
    return [
      `L ${a} ${y}`,
      `C ${a} ${y + depth * 0.55}, ${mid - HALF * 0.3} ${y + depth}, ${mid} ${y + depth}`,
      `C ${mid + HALF * 0.3} ${y + depth}, ${b} ${y + depth * 0.55}, ${b} ${y}`,
      `L 1 ${y}`,
    ].join(" ");
  }
  const a = mid + HALF;
  const b = mid - HALF;
  return [
    `L ${a} ${y}`,
    `C ${a} ${y + depth * 0.55}, ${mid + HALF * 0.3} ${y + depth}, ${mid} ${y + depth}`,
    `C ${mid - HALF * 0.3} ${y + depth}, ${b} ${y + depth * 0.55}, ${b} ${y}`,
    `L 0 ${y}`,
  ].join(" ");
}

function verticalBump(x: number, travelingDown: boolean, edge: Edge): string {
  if (edge === "flat") return travelingDown ? `L ${x} 1` : `L ${x} 0`;
  const mid = 0.5;
  const depth = TAB * (edge === "out" ? (x > 0.5 ? 1 : -1) : x > 0.5 ? -1 : 1);
  if (travelingDown) {
    const a = mid - HALF;
    const b = mid + HALF;
    return [
      `L ${x} ${a}`,
      `C ${x + depth * 0.55} ${a}, ${x + depth} ${mid - HALF * 0.3}, ${x + depth} ${mid}`,
      `C ${x + depth} ${mid + HALF * 0.3}, ${x + depth * 0.55} ${b}, ${x} ${b}`,
      `L ${x} 1`,
    ].join(" ");
  }
  const a = mid + HALF;
  const b = mid - HALF;
  return [
    `L ${x} ${a}`,
    `C ${x + depth * 0.55} ${a}, ${x + depth} ${mid + HALF * 0.3}, ${x + depth} ${mid}`,
    `C ${x + depth} ${mid - HALF * 0.3}, ${x + depth * 0.55} ${b}, ${x} ${b}`,
    `L ${x} 0`,
  ].join(" ");
}

/** Closed puzzle-piece path in objectBoundingBox units (CW from top-left). */
function piecePath(spec: PieceSpec): string {
  return [
    "M 0 0",
    horizontalBump(0, true, spec.top),
    verticalBump(1, true, spec.right),
    horizontalBump(1, false, spec.bottom),
    verticalBump(0, false, spec.left),
    "Z",
  ].join(" ");
}

/**
 * Six CD-jewel collage faces arranged as an interlocking puzzle on the white game page.
 */
export function HomepageBundlePuzzle({ className = "", onActivate }: HomepageBundlePuzzleProps) {
  const uid = useId().replace(/:/g, "");

  // Cell size as % of board; inflate so outward tabs overlap neighbors.
  const cellW = 100 / 3;
  const cellH = 100 / 2;
  const inflateX = cellW * TAB * 0.55;
  const inflateY = cellH * TAB * 0.55;

  return (
    <div
      className={`relative mx-auto aspect-[3/2] w-full max-w-3xl ${className}`}
      data-testid="homepage-bundle-puzzle"
    >
      <svg width={0} height={0} className="absolute" aria-hidden>
        <defs>
          {PIECES.map((piece, i) => (
            <clipPath key={piece.label} id={`${uid}-piece-${i}`} clipPathUnits="objectBoundingBox">
              <path d={piecePath(piece)} />
            </clipPath>
          ))}
        </defs>
      </svg>

      <button
        type="button"
        onClick={() => onActivate?.()}
        className="group relative block h-full w-full cursor-pointer overflow-visible border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-label="Open Steal the Old Man's Bundle puzzle — tap to play"
        data-testid="homepage-bundle-puzzle-activate"
      >
        <span className="sr-only">Six ibPw collage pieces — tap to play</span>
        <div className="relative h-full w-full overflow-visible">
          {PIECES.map((piece, i) => {
            const src = BUNDLE_CUBE_FACE_URLS[i];
            const left = piece.col * cellW - inflateX;
            const top = piece.row * cellH - inflateY;
            const width = cellW + inflateX * 2;
            const height = cellH + inflateY * 2;
            return (
              <div
                key={piece.label}
                className="homepage-puzzle-piece absolute overflow-hidden"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                  zIndex: i + 1,
                  clipPath: `url(#${uid}-piece-${i})`,
                  WebkitClipPath: `url(#${uid}-piece-${i})`,
                  animation: `homepagePuzzleIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${i * 70}ms both`,
                  filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.32))",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${src}?v=puzzle-1`}
                  alt=""
                  draggable={false}
                  className="pointer-events-none h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.045] group-active:scale-[0.99]"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-black/30 mix-blend-soft-light transition duration-500 group-hover:from-white/28"
                />
              </div>
            );
          })}
        </div>
      </button>

      <style jsx>{`
        @keyframes homepagePuzzleIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .homepage-puzzle-piece {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
