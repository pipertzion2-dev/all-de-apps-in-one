"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { BUNDLE_CUBE_FACE_URLS } from "@/lib/clean-sneaks/assets";

type HomepageBundlePuzzleProps = {
  className?: string;
  /** Fired when the user activates the puzzle (tap / Enter / Space). */
  onActivate?: () => void;
  /** Columns of interlocking pieces (default 3). */
  cols?: number;
  /** Rows of interlocking pieces (default 2). */
  rows?: number;
  /**
   * Fill the parent completely (edge-to-edge). Used on the game start screen.
   * Stretches the board to the viewport and densifies cols/rows from screen size.
   */
  fillScreen?: boolean;
};

/**
 * Target on-screen piece size when filling the start viewport.
 * Larger = fewer pieces, more of each CD-jewel graphic visible.
 */
const FILL_PIECE_PX = 260;

type Edge = "flat" | "out" | "in";

type PieceSpec = {
  label: string;
  col: number;
  row: number;
  top: Edge;
  right: Edge;
  bottom: Edge;
  left: Edge;
  faceIndex: number;
};

/** Tab size as a fraction of one cell (not the whole board). */
const TAB = 0.26;
/** Slight inset so knobs read on the compact homepage board. */
const PIECE_SCALE_COMPACT = 0.93;
/** Tiny overscale on fill boards so anti-alias seams never flash the underlay. */
const PIECE_SCALE_FILL = 1.015;

const CELL = 100;

function opposite(edge: Edge): Edge {
  if (edge === "out") return "in";
  if (edge === "in") return "out";
  return "flat";
}

function buildPieces(cols: number, rows: number): PieceSpec[] {
  const pieces: PieceSpec[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const right: Edge = col === cols - 1 ? "flat" : (row + col) % 2 === 0 ? "out" : "in";
      const bottom: Edge = row === rows - 1 ? "flat" : (row + col) % 2 === 0 ? "out" : "in";
      const left: Edge = col === 0 ? "flat" : opposite((row + (col - 1)) % 2 === 0 ? "out" : "in");
      const top: Edge = row === 0 ? "flat" : opposite((row - 1 + col) % 2 === 0 ? "out" : "in");
      pieces.push({
        label: `ibPw ${row * cols + col + 1}`,
        col,
        row,
        top,
        right,
        bottom,
        left,
        faceIndex: (row * cols + col) % BUNDLE_CUBE_FACE_URLS.length,
      });
    }
  }
  return pieces;
}

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
 * CD-jewel collage faces arranged as an interlocking puzzle.
 * Compact 3×2 by default; pass cols/rows + fillScreen for a full-bleed start board.
 */
export function HomepageBundlePuzzle({
  className = "",
  onActivate,
  cols: colsProp = 3,
  rows: rowsProp = 2,
  fillScreen = false,
}: HomepageBundlePuzzleProps) {
  const uid = useId().replace(/:/g, "");
  const [fillGrid, setFillGrid] = useState({ cols: colsProp, rows: rowsProp });

  useEffect(() => {
    if (!fillScreen || typeof window === "undefined") return;
    const sync = () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      setFillGrid({
        cols: Math.max(3, Math.ceil(w / FILL_PIECE_PX)),
        rows: Math.max(3, Math.ceil(h / FILL_PIECE_PX)),
      });
    };
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, [fillScreen, colsProp, rowsProp]);

  const cols = fillScreen ? fillGrid.cols : colsProp;
  const rows = fillScreen ? fillGrid.rows : rowsProp;
  const pieces = useMemo(() => buildPieces(cols, rows), [cols, rows]);
  const boardW = cols * CELL;
  const boardH = rows * CELL;
  const scale = fillScreen ? PIECE_SCALE_FILL : PIECE_SCALE_COMPACT;

  return (
    <div
      className={
        fillScreen
          ? `relative h-full w-full ${className}`
          : `relative mx-auto aspect-[3/2] w-full max-w-3xl ${className}`
      }
      data-testid="homepage-bundle-puzzle"
      data-puzzle-cols={cols}
      data-puzzle-rows={rows}
      data-puzzle-fill={fillScreen ? "true" : undefined}
    >
      <button
        type="button"
        onClick={() => onActivate?.()}
        className="group relative block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-label="Open Steal the Old Man's Bundle puzzle — tap to play"
        data-testid="homepage-bundle-puzzle-activate"
      >
        <span className="sr-only">{cols * rows} ibPw collage puzzle pieces — tap to play</span>
        <svg
          viewBox={`0 0 ${boardW} ${boardH}`}
          preserveAspectRatio={fillScreen ? "none" : "xMidYMid meet"}
          className={
            fillScreen
              ? "h-full w-full"
              : "h-full w-full overflow-visible drop-shadow-[0_12px_22px_rgba(0,0,0,0.28)]"
          }
          role="img"
          aria-hidden
        >
          <defs>
            {pieces.map((piece, i) => (
              <clipPath key={piece.label} id={`${uid}-piece-${i}`}>
                <path d={piecePath(piece)} />
              </clipPath>
            ))}
          </defs>
          {/* White underlay — never show black through tab seams. */}
          <rect x={0} y={0} width={boardW} height={boardH} fill="#ffffff" />
          {pieces.map((piece, i) => {
            const src = `${BUNDLE_CUBE_FACE_URLS[piece.faceIndex]}?v=puzzle-4`;
            const x = piece.col * CELL;
            const y = piece.row * CELL;
            // Fill boards: keep most of the square collage in the cell (light tab bleed).
            // Compact boards: larger pad so tabs stay filled when pieces are inset.
            const pad = fillScreen ? TAB * CELL * 0.35 : TAB * CELL;
            const cx = x + CELL / 2;
            const cy = y + CELL / 2;
            const delay = Math.min(i * 28, 700);
            return (
              <g
                key={piece.label}
                className="homepage-puzzle-piece"
                style={{
                  animation: fillScreen
                    ? `homepagePuzzleIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`
                    : `homepagePuzzleIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${i * 70}ms both`,
                  transformOrigin: `${cx}px ${cy}px`,
                }}
                transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}
              >
                <image
                  href={src}
                  x={x - pad}
                  y={y - pad}
                  width={CELL + pad * 2}
                  height={CELL + pad * 2}
                  preserveAspectRatio="xMidYMid meet"
                  clipPath={`url(#${uid}-piece-${i})`}
                  className="transition duration-500 ease-out group-hover:brightness-110"
                />
                <path
                  d={piecePath(piece)}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={fillScreen ? 1.4 : 2}
                  vectorEffect="non-scaling-stroke"
                  className="pointer-events-none"
                />
                <path
                  d={piecePath(piece)}
                  fill="none"
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth={fillScreen ? 0.7 : 1.1}
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
