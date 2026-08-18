"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { ThreeCRTFlowers } from "./three-crt-flowers";

type ScenePreset = "hero" | "features" | "howItWorks" | "evals" | "pricing" | "checkout" | "oaas";

type Rgba = { r: number; g: number; b: number; a: number };

function parseRgba(color: string): Rgba | null {
  const match = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/,
  );
  if (!match) return null;
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] !== undefined ? Number(match[4]) : 1,
  };
}

function rgbaToString(c: Rgba): string {
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${c.a.toFixed(2)})`;
}

function averageRgbaColors(colors: (string | null)[]): string | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  let count = 0;
  for (const color of colors) {
    if (!color) continue;
    const parsed = parseRgba(color);
    if (!parsed) continue;
    r += parsed.r;
    g += parsed.g;
    b += parsed.b;
    a += parsed.a;
    count++;
  }
  if (count === 0) return null;
  return rgbaToString({ r: r / count, g: g / count, b: b / count, a: a / count });
}

function neighborBlendColor(
  grid: number[][],
  x: number,
  y: number,
  cols: number,
  rows: number,
  palette: (string | null)[],
): string | null {
  const samples: (string | null)[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      samples.push(palette[grid[ny][nx]] ?? null);
    }
  }
  return averageRgbaColors(samples);
}

function drawSoftCamoCell(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  blockSize: number,
  centerColor: string | null,
  edgeColor: string | null,
) {
  if (!centerColor && !edgeColor) return;
  const cx = px + blockSize / 2;
  const cy = py + blockSize / 2;
  if (!centerColor || !edgeColor || centerColor === edgeColor) {
    ctx.fillStyle = centerColor ?? edgeColor!;
    ctx.fillRect(px, py, blockSize, blockSize);
    return;
  }
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, blockSize * 0.75);
  grad.addColorStop(0, centerColor);
  grad.addColorStop(1, edgeColor);
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, blockSize, blockSize);
}

interface CamoThreeOverlayProps {
  preset?: ScenePreset;
  className?: string;
  isIntro?: boolean;
  /** Mount flowers immediately instead of waiting for IntersectionObserver. */
  eagerMount?: boolean;
  /** Once flowers mount, keep the WebGL scene alive to avoid remount flicker. */
  keepMounted?: boolean;
}

export function CamoThreeOverlay({
  preset = "hero",
  className = "",
  isIntro = false,
  eagerMount = false,
  keepMounted = false,
}: CamoThreeOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Intro / eager sections mount immediately; others gate on viewport to protect
  // mobile WebGL context limits (context lost).
  const [flowersActive, setFlowersActive] = useState(isIntro || eagerMount);

  const seed = useMemo(() => {
    const presetSeeds: Record<ScenePreset, number> = {
      hero: 42,
      features: 137,
      howItWorks: 256,
      evals: 389,
      pricing: 512,
      checkout: 640,
      oaas: 773,
    };
    return presetSeeds[preset];
  }, [preset]);

  useEffect(() => {
    if (isIntro || eagerMount) {
      setFlowersActive(true);
      return;
    }

    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setFlowersActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        setFlowersActive((prev) => (keepMounted && prev ? true : visible));
      },
      { root: null, rootMargin: "280px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isIntro, eagerMount, keepMounted, preset]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderCamo = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) return;

      canvas.width = width;
      canvas.height = height;

      const blockSize = 12;
      const cols = Math.ceil(width / blockSize);
      const rows = Math.ceil(height / blockSize);

      const seededRandom = (x: number, y: number, offset: number = 0) => {
        const n = Math.sin(seed * 12.9898 + x * 78.233 + y * 45.164 + offset) * 43758.5453;
        return n - Math.floor(n);
      };

      const isCheckoutCamo = preset === "checkout";
      const isIntroCamo = preset === "hero";
      const isOaasCamo = preset === "oaas";

      const introColors = [
        "rgba(210, 170, 180, 0.38)", // 0: blush pink
        null, // 1: transparent (flowers show)
        "rgba(175, 150, 185, 0.35)", // 2: soft lavender
        "rgba(140, 170, 110, 0.36)", // 3: leaf sage green
        "rgba(200, 200, 145, 0.32)", // 4: pale chartreuse
        "rgba(100, 30, 45, 0.4)", // 5: deep crimson
        "rgba(150, 165, 180, 0.32)", // 6: cool steel blue-grey
        "rgba(185, 165, 150, 0.34)", // 7: warm sand/taupe
        "rgba(75, 40, 70, 0.38)", // 8: dark plum
        "rgba(180, 135, 150, 0.33)", // 9: rosy mauve
        "rgba(160, 180, 155, 0.32)", // 10: muted moss
      ];

      const checkoutColors = [
        null,
        null,
        "rgba(216, 160, 176, 0.12)",
        null,
        "rgba(184, 160, 200, 0.10)",
        null,
        null,
      ];

      // OaaS mixing board: intro-style camo tints with transparent gaps for water + blooms.
      const oaasColors = [
        null,
        "rgba(210, 170, 180, 0.28)",
        null,
        "rgba(175, 150, 185, 0.24)",
        null,
        "rgba(140, 170, 110, 0.26)",
        null,
        "rgba(91, 141, 168, 0.22)",
        null,
        "rgba(15, 35, 40, 0.30)",
      ];

      const toneCount = isCheckoutCamo
        ? checkoutColors.length
        : isIntroCamo
          ? introColors.length
          : isOaasCamo
            ? oaasColors.length
            : 3;
      const grid: number[][] = [];
      for (let y = 0; y < rows; y++) {
        grid[y] = [];
        for (let x = 0; x < cols; x++) {
          const rand = seededRandom(x, y);
          const clusterX = Math.floor(x / 4);
          const clusterY = Math.floor(y / 4);
          const clusterRand = seededRandom(clusterX, clusterY, 50);
          const combined = rand * 0.35 + clusterRand * 0.65;

          if (isCheckoutCamo || isIntroCamo || isOaasCamo) {
            grid[y][x] = Math.min(Math.floor(combined * toneCount), toneCount - 1);
          } else {
            if (combined < 0.333) {
              grid[y][x] = 0;
            } else if (combined < 0.666) {
              grid[y][x] = 1;
            } else {
              grid[y][x] = 2;
            }
          }
        }
      }

      for (let pass = 0; pass < 2; pass++) {
        for (let y = 1; y < rows - 1; y++) {
          for (let x = 1; x < cols - 1; x++) {
            const neighbors = [
              grid[y - 1]?.[x],
              grid[y + 1]?.[x],
              grid[y]?.[x - 1],
              grid[y]?.[x + 1],
              grid[y - 1]?.[x - 1],
              grid[y - 1]?.[x + 1],
              grid[y + 1]?.[x - 1],
              grid[y + 1]?.[x + 1],
            ];
            const counts = Array(toneCount).fill(0);
            neighbors.forEach((n) => {
              if (n !== undefined) counts[n]++;
            });

            const currentCount = counts[grid[y][x]];
            if (currentCount < 2 && seededRandom(x, y, 100 + pass) > 0.4) {
              grid[y][x] = counts.indexOf(Math.max(...counts));
            }
          }
        }
      }

      ctx.clearRect(0, 0, width, height);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * blockSize;
          const py = y * blockSize;
          const val = grid[y][x];

          if (isCheckoutCamo) {
            const color = checkoutColors[val];
            if (color) {
              ctx.fillStyle = color;
              ctx.fillRect(px, py, blockSize, blockSize);
            }
          } else if (isOaasCamo) {
            const color = oaasColors[val];
            const edge = neighborBlendColor(grid, x, y, cols, rows, oaasColors);
            drawSoftCamoCell(ctx, px, py, blockSize, color, edge ?? color);
          } else if (isIntroCamo) {
            const color = introColors[val];
            if (color) {
              ctx.fillStyle = color;
              ctx.fillRect(px, py, blockSize, blockSize);
            }
          } else {
            if (val === 0) {
              ctx.fillStyle = "rgb(0, 0, 0)";
              ctx.fillRect(px, py, blockSize, blockSize);
            } else if (val === 2) {
              ctx.fillStyle = "rgba(15, 35, 40, 0.58)";
              ctx.fillRect(px, py, blockSize, blockSize);
            }
          }
        }
      }
    };

    renderCamo();

    const resizeObserver = new ResizeObserver(renderCamo);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [seed, preset]);

  const isCheckout = preset === "checkout";
  const isOaas = preset === "oaas";

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden w-full h-full min-h-full ${isCheckout ? "min-h-[200px]" : "min-h-[400px]"} ${className}`}
    >
      <div
        className={`absolute inset-0 w-full h-full min-h-full ${isCheckout ? "min-h-[200px]" : "min-h-[400px]"}`}
        style={{
          filter: isCheckout
            ? "brightness(1.0) saturate(1.1)"
            : isOaas
              ? "brightness(1.22) saturate(1.5) contrast(1.08)"
              : isIntro
                ? "brightness(1.05) saturate(1.35)"
                : "brightness(1.15) saturate(1.1)",
        }}
      >
        {flowersActive ? <ThreeCRTFlowers key={preset} preset={preset} isIntro={isIntro} /> : null}
      </div>

      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none ${
          isCheckout
            ? "opacity-30"
            : isOaas
              ? "opacity-38 md:opacity-48"
              : isIntro
                ? "opacity-55 md:opacity-60"
                : "opacity-60 md:opacity-100"
        }`}
      />
    </div>
  );
}
