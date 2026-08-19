"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { ThreeCRTFlowers } from "./three-crt-flowers";

type ScenePreset = "hero" | "features" | "howItWorks" | "evals" | "pricing" | "checkout" | "oaas";

const SECTION_CAMO_PRESETS = new Set<ScenePreset>(["features", "howItWorks", "evals", "pricing"]);

function isSectionCamoPreset(preset: ScenePreset): boolean {
  return SECTION_CAMO_PRESETS.has(preset);
}

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

function lerpRgba(a: Rgba | null, b: Rgba | null, t: number): Rgba | null {
  if (!a) return b;
  if (!b) return a;
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
    a: a.a + (b.a - a.a) * t,
  };
}

function paletteColorAt(palette: (string | null)[], t: number): Rgba | null {
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (palette.length - 1);
  const i0 = Math.floor(scaled);
  const i1 = Math.min(i0 + 1, palette.length - 1);
  const frac = scaled - i0;
  const c0 = palette[i0] ? parseRgba(palette[i0]!) : null;
  const c1 = palette[i1] ? parseRgba(palette[i1]!) : null;
  return lerpRgba(c0, c1, frac);
}

function oaasNoiseAt(
  gx: number,
  gy: number,
  seededRandom: (x: number, y: number, offset?: number) => number,
): number {
  const fine = seededRandom(gx, gy, 120);
  const medium = seededRandom(gx * 0.37 + gy * 0.11, gy * 0.29 - gx * 0.07, 50);
  const coarse = seededRandom(gx * 0.13 - gy * 0.09, gy * 0.17 + gx * 0.05, 70);
  const raw = fine * 0.48 + medium * 0.32 + coarse * 0.2;
  return raw * raw * (3 - 2 * raw);
}

function drawOaasCamoSmooth(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  blockSize: number,
  palette: (string | null)[],
  seededRandom: (x: number, y: number, offset?: number) => number,
) {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let py = 0; py < height; py++) {
    const gy = py / blockSize;
    for (let px = 0; px < width; px++) {
      const gx = px / blockSize;
      const tone = oaasNoiseAt(gx, gy, seededRandom);
      const rgba = paletteColorAt(palette, tone);

      const idx = (py * width + px) * 4;
      if (rgba && rgba.a > 0.008) {
        data[idx] = rgba.r;
        data[idx + 1] = rgba.g;
        data[idx + 2] = rgba.b;
        data[idx + 3] = Math.round(Math.min(1, rgba.a) * 255);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
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
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileViewport(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

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
      const isSectionCamo = isSectionCamoPreset(preset);
      // OaaS keeps block digi camo; only lower sections use smooth camo on phones.
      const useSmoothSectionCamo = isSectionCamo && isMobileViewport;

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

      // Section camo: intro-style tints with transparent gaps so blooms read on phones.
      const sectionCamoColors = [
        null,
        "rgba(210, 170, 180, 0.24)",
        null,
        "rgba(175, 150, 185, 0.20)",
        null,
        "rgba(140, 170, 110, 0.18)",
        null,
        "rgba(91, 141, 168, 0.18)",
        null,
        "rgba(45, 72, 82, 0.20)",
      ];

      const toneCount = isCheckoutCamo
        ? checkoutColors.length
        : isIntroCamo
          ? introColors.length
          : isOaasCamo
            ? oaasColors.length
            : 3;

      ctx.clearRect(0, 0, width, height);

      if (useSmoothSectionCamo) {
        drawOaasCamoSmooth(ctx, width, height, blockSize, sectionCamoColors, seededRandom);
        return;
      }

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
            if (color) {
              ctx.fillStyle = color;
              ctx.fillRect(px, py, blockSize, blockSize);
            }
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
  }, [seed, preset, isMobileViewport]);

  const isCheckout = preset === "checkout";
  const isOaas = preset === "oaas";
  const isSectionCamo = isSectionCamoPreset(preset);
  const useMobileSectionCamo = isSectionCamo && isMobileViewport;

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
              : useMobileSectionCamo
                ? "brightness(1.14) saturate(1.28) contrast(1.04)"
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
              ? "opacity-38 md:opacity-48 blur-[1.2px]"
              : useMobileSectionCamo
                ? "opacity-[0.36] md:opacity-[0.72] md:blur-0"
                : isIntro
                  ? "opacity-55 md:opacity-60"
                  : "opacity-60 md:opacity-100"
        }`}
      />
    </div>
  );
}
