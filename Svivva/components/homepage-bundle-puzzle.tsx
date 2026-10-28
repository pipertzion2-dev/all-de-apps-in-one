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

/** Tab size as a fraction of one cell (not the whole board). */
const TAB = 0.28;
/** Pull each piece slightly inward so knobs/sockets read clearly. */
const PIECE_SCALE = 0.93;

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

/** Board is 300×200 viewBox units → each cell 100×100. */
const CELL = 100;

function hBump(y: number, x0: number, x1: number, edge: Edge, outwardSign: 1 | -1): string {
  if (edge === "flat") return `L ${x1} ${y}`;
  const mid = (x0 + x1) / 2;
  const half = (TAB * CELL) / 2;
  const depth = TAB * CELL * (edge === "out" ? outwardSign : -outwardSign);
  const a = mid - half;
  const b = mid + half;
  const goingRight = x1 > x0;
  if (goingRight) {
    return [
      `L ${a} ${y}`,
      `C ${a} ${y + depth * 0.55}, ${mid - half * 0.25} ${y + depth}, ${mid} ${y + depth}`,
      `C ${mid + half * 0.25} ${y + depth}, ${b} ${y + depth * 0.55}, ${b} ${y}`,
      `L ${x1} ${y}`,
    ].join(" ");
  }
  return [
    `L ${b} ${y}`,
    `C ${b} ${y + depth * 0.55}, ${mid + half * 0.25} ${y + depth}, ${mid} ${y + depth}`,
    `C ${mid - half * 0.25} ${y + depth}, ${a} ${y + depth * 0.55}, ${a} ${y}`,
    `L ${x1} ${y}`,
  ].join(" ");
}

function vBump(x: number, y0: number, y1: number, edge: Edge, outwardSign: 1 | -1): string {
  if (edge === "flat") return `L ${x} ${y1}`;
  const mid = (y0 + y1) / 2;
  const half = (TAB * CELL) / 2;
  const depth = TAB * CELL * (edge === "out" ? outwardSign : -outwardSign);
  const a = mid - half;
  const b = mid + half;
  const goingDown = y1 > y0;
  if (goingDown) {
    return [
      `L ${x} ${a}`,
      `C ${x + depth * 0.55} ${a}, ${x + depth} ${mid - half * 0.25}, ${x + depth} ${mid}`,
      `C ${x + depth} ${mid + half * 0.25}, ${x + depth * 0.55} ${b}, ${x} ${b}`,
      `L ${x} ${y1}`,
    ].join(" ");
  }
  return [
    `L ${x} ${b}`,
    `C ${x + depth * 0.55} ${b}, ${x + depth} ${mid + half * 0.25}, ${x + depth} ${mid}`,
    `C ${x + depth} ${mid - half * 0.25}, ${x + depth * 0.55} ${a}, ${x} ${a}`,
    `L ${x} ${y1}`,
  ].join(" ");
}

/** Closed puzzle path in board viewBox coordinates (CW from cell top-left). */
function piecePath(spec: PieceSpec): string {
  const x0 = spec.col * CELL;
  const y0 = spec.row * CELL;
  const x1 = x0 + CELL;
  const y1 = y0 + CELL;
  return [
    `M ${x0} ${y0}`,
    hBump(y0, x0, x1, spec.top, -1),
    vBump(x1, y0, y1, spec.right, 1),
    hBump(y1, x1, x0, spec.bottom, 1),
    vBump(x0, y1, y0, spec.left, -1),
    "Z",
  ].join(" ");
}

/**
 * Six CD-jewel collage faces arranged as an interlocking puzzle on the white game page.
 */
export function HomepageBundlePuzzle({ className = "", onActivate }: HomepageBundlePuzzleProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <div
      className={`relative mx-auto aspect-[3/2] w-full max-w-3xl ${className}`}
      data-testid="homepage-bundle-puzzle"
    >
      <button
        type="button"
        onClick={() => onActivate?.()}
        className="group relative block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-label="Open Steal the Old Man's Bundle puzzle — tap to play"
        data-testid="homepage-bundle-puzzle-activate"
      >
        <span className="sr-only">Six ibPw collage pieces — tap to play</span>
        <svg
          viewBox="0 0 300 200"
          className="h-full w-full overflow-visible drop-shadow-[0_12px_22px_rgba(0,0,0,0.28)]"
          role="img"
          aria-hidden
        >
          <defs>
            {PIECES.map((piece, i) => (
              <clipPath key={piece.label} id={`${uid}-piece-${i}`}>
                <path d={piecePath(piece)} />
              </clipPath>
            ))}
          </defs>
          {PIECES.map((piece, i) => {
            const src = `${BUNDLE_CUBE_FACE_URLS[i]}?v=puzzle-2`;
            const x = piece.col * CELL;
            const y = piece.row * CELL;
            // Inflate the bitmap so outward tabs still have pixels to show.
            const pad = TAB * CELL;
            const cx = x + CELL / 2;
            const cy = y + CELL / 2;
            return (
              <g
                key={piece.label}
                className="homepage-puzzle-piece"
                style={{
                  animation: `homepagePuzzleIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${i * 70}ms both`,
                  transformOrigin: `${cx}px ${cy}px`,
                }}
                transform={`translate(${cx} ${cy}) scale(${PIECE_SCALE}) translate(${-cx} ${-cy})`}
              >
                <image
                  href={src}
                  x={x - pad}
                  y={y - pad}
                  width={CELL + pad * 2}
                  height={CELL + pad * 2}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#${uid}-piece-${i})`}
                  className="transition duration-500 ease-out group-hover:brightness-110"
                />
                {/* Edge so knobs/sockets read as cut puzzle pieces */}
                <path
                  d={piecePath(piece)}
                  fill="none"
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  className="pointer-events-none"
                />
                <path
                  d={piecePath(piece)}
                  fill="none"
                  stroke="rgba(0,0,0,0.55)"
                  strokeWidth={1.1}
                  vectorEffect="non-scaling-stroke"
                  className="pointer-events-none"
                />
              </g>
            );
          })}
        </svg>
      </button>

      <style jsx>{`
        @keyframes homepagePuzzleIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.homepage-puzzle-piece) {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
