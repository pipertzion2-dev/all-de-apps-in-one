"use client";

import { useEffect, useRef, useMemo } from "react";
import { ThreeCRTFlowers } from "./three-crt-flowers";

type ScenePreset = "hero" | "features" | "howItWorks" | "evals" | "pricing" | "checkout";

interface CamoThreeOverlayProps {
  preset?: ScenePreset;
  className?: string;
  isIntro?: boolean;
}

export function CamoThreeOverlay({
  preset = "hero",
  className = "",
  isIntro = false,
}: CamoThreeOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const seed = useMemo(() => {
    const presetSeeds: Record<ScenePreset, number> = {
      hero: 42,
      features: 137,
      howItWorks: 256,
      evals: 389,
      pricing: 512,
      checkout: 640,
    };
    return presetSeeds[preset];
  }, [preset]);

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

      const toneCount = isCheckoutCamo
        ? checkoutColors.length
        : isIntroCamo
          ? introColors.length
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

          if (isCheckoutCamo || isIntroCamo) {
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

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden w-full h-full ${isCheckout ? "min-h-[200px]" : "min-h-[400px]"} ${className}`}
    >
      <div
        className={`absolute inset-0 w-full h-full ${isCheckout ? "min-h-[200px]" : "min-h-[400px]"}`}
        style={{
          filter: isCheckout
            ? "brightness(1.0) saturate(1.1)"
            : isIntro
              ? "brightness(1.05) saturate(1.35)"
              : "brightness(1.15) saturate(1.1)",
        }}
      >
        <ThreeCRTFlowers key={preset} preset={preset} isIntro={isIntro} />
      </div>

      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none ${isCheckout ? "opacity-30" : isIntro ? "opacity-55 md:opacity-60" : "opacity-60 md:opacity-100"}`}
      />
    </div>
  );
}
