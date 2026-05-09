"use client";

import { useRef, useEffect } from "react";

interface ProductSketchViewerProps {
  productName: string;
  productCategory: string;
  materials: string[];
  requirements: string[];
  className?: string;
}

function drawDevice(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  const cx = w / 2;
  const cy = h / 2;
  const bw = w * 0.55;
  const bh = h * 0.75;
  const r = 12;

  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, r);
  ctx.stroke();

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2 + 8, cy - bh / 2 + 12, bw - 16, bh - 30, 4);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#333";
  ctx.fillRect(cx - bw / 2 + 8, cy - bh / 2 + 12, bw - 16, bh - 30);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy + bh / 2 - 12, 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - bh / 2 + 6);
  ctx.lineTo(cx + 8, cy - bh / 2 + 6);
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + bw / 2 + 4, cy - 15 + i * 12);
    ctx.lineTo(cx + bw / 2 + 12, cy - 15 + i * 12);
    ctx.stroke();

    ctx.fillStyle = "#666";
    ctx.font = "7px monospace";
    ctx.fillText(["Vol+", "Vol-", "PWR"][i], cx + bw / 2 + 15, cy - 12 + i * 12);
  }
}

function drawAppliance(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  const cx = w / 2;
  const cy = h / 2;
  const bw = w * 0.4;
  const bh = h * 0.7;

  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - bw / 2, cy + bh / 2);
  ctx.lineTo(cx - bw / 2 - 5, cy - bh / 2 + 20);
  ctx.quadraticCurveTo(cx - bw / 2 - 5, cy - bh / 2, cx, cy - bh / 2);
  ctx.quadraticCurveTo(cx + bw / 2 + 5, cy - bh / 2, cx + bw / 2 + 5, cy - bh / 2 + 20);
  ctx.lineTo(cx + bw / 2, cy + bh / 2);
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy - bh / 2 + 8, 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#666";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.ellipse(cx, cy - bh / 2 + 30, bw / 3, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cx - 15, cy + 10, 30, 20, 3);
  ctx.stroke();

  ctx.fillStyle = "#444";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(cx - 8 + i * 8, cy + 20, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWearable(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  const cx = w / 2;
  const cy = h / 2;
  const faceR = w * 0.18;

  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, faceR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.arc(cx, cy, faceR - 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(cx, cy, faceR - 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + faceR + 3, cy - 4);
  ctx.lineTo(cx + faceR + 10, cy - 4);
  ctx.lineTo(cx + faceR + 10, cy + 4);
  ctx.lineTo(cx + faceR + 3, cy + 4);
  ctx.stroke();

  ctx.strokeStyle = "#999";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  const bandLen = h * 0.25;
  ctx.beginPath();
  ctx.moveTo(cx - faceR * 0.4, cy - faceR);
  ctx.quadraticCurveTo(cx - faceR * 0.3, cy - faceR - bandLen * 0.5, cx, cy - faceR - bandLen);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + faceR * 0.4, cy - faceR);
  ctx.quadraticCurveTo(cx + faceR * 0.3, cy - faceR - bandLen * 0.5, cx, cy - faceR - bandLen);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - faceR * 0.4, cy + faceR);
  ctx.quadraticCurveTo(cx - faceR * 0.3, cy + faceR + bandLen * 0.5, cx, cy + faceR + bandLen);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + faceR * 0.4, cy + faceR);
  ctx.quadraticCurveTo(cx + faceR * 0.3, cy + faceR + bandLen * 0.5, cx, cy + faceR + bandLen);
  ctx.stroke();
  ctx.lineCap = "butt";
}

function drawIndustrial(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  const cx = w / 2;
  const cy = h / 2;
  const bw = w * 0.6;
  const bh = h * 0.15;

  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(cx - bw / 2, cy + h * 0.15, bw, bh);
  ctx.stroke();

  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 1.5;
  const colW = 15;
  const colH = h * 0.45;
  ctx.beginPath();
  ctx.rect(cx - bw / 2 + 15, cy + h * 0.15 - colH, colW, colH);
  ctx.stroke();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - bw / 2 + 15 + colW / 2, cy + h * 0.15 - colH);
  ctx.lineTo(cx + bw / 4, cy + h * 0.15 - colH);
  ctx.stroke();

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + bw / 4, cy + h * 0.15 - colH);
  ctx.lineTo(cx + bw / 4, cy + h * 0.15 - colH + 30);
  ctx.stroke();

  ctx.strokeStyle = accent;
  ctx.beginPath();
  ctx.arc(cx + bw / 4, cy + h * 0.15 - colH + 35, 5, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = -1; i <= 1; i += 2) {
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(cx + i * bw * 0.35 - 10, cy + h * 0.15 + bh, 20, 6);
    ctx.stroke();
  }
}

function drawGeneric(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  const cx = w / 2;
  const cy = h / 2;
  const bw = w * 0.5;
  const bh = h * 0.4;

  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 8);
  ctx.stroke();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2 + 6, cy - bh / 2 + 4, bw - 12, 6, 2);
  ctx.stroke();

  ctx.strokeStyle = "#666";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - bh / 2);
  ctx.lineTo(cx, cy + bh / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - bw / 2, cy);
  ctx.lineTo(cx + bw / 2, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx + bw / 4, cy + bh / 4, 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(cx - bw / 4 - 12, cy + 5, 24, 12, 2);
  ctx.stroke();
}

export function ProductSketchViewer({
  productName,
  productCategory,
  materials,
  requirements,
  className,
}: ProductSketchViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, displayW, displayH);

    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < displayW; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, displayH);
      ctx.stroke();
    }
    for (let y = 0; y < displayH; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(displayW, y);
      ctx.stroke();
    }

    const accent =
      materials.includes("Carbon fiber") || materials.includes("Titanium") ? "#5BA8A0" : "#A05068";
    const cat = productCategory.toLowerCase();

    if (
      cat.includes("electron") ||
      cat.includes("device") ||
      cat.includes("phone") ||
      cat.includes("tablet") ||
      cat.includes("gadget")
    ) {
      drawDevice(ctx, displayW, displayH, accent);
    } else if (cat.includes("home") || cat.includes("appliance") || cat.includes("kitchen")) {
      drawAppliance(ctx, displayW, displayH, accent);
    } else if (
      cat.includes("wear") ||
      cat.includes("watch") ||
      cat.includes("fitness") ||
      cat.includes("health")
    ) {
      drawWearable(ctx, displayW, displayH, accent);
    } else if (
      cat.includes("industrial") ||
      cat.includes("tool") ||
      cat.includes("machine") ||
      cat.includes("equipment")
    ) {
      drawIndustrial(ctx, displayW, displayH, accent);
    } else {
      drawGeneric(ctx, displayW, displayH, accent);
    }

    ctx.fillStyle = "#5BA8A0";
    ctx.font = "bold 8px monospace";
    ctx.fillText((productName || "CONCEPT").toUpperCase() + " — SKETCH", 8, 14);

    ctx.fillStyle = "#444";
    ctx.font = "7px monospace";
    ctx.fillText("SVIVVA DESIGN", displayW - 80, displayH - 8);

    if (materials.length > 0) {
      ctx.fillStyle = "#555";
      ctx.font = "6px monospace";
      ctx.fillText("MAT: " + materials.slice(0, 2).join(", "), 8, displayH - 8);
    }

    const annotations = [
      { x: displayW * 0.15, y: displayH * 0.25, label: "A" },
      { x: displayW * 0.8, y: displayH * 0.3, label: "B" },
      { x: displayW * 0.75, y: displayH * 0.75, label: "C" },
    ];
    annotations.forEach(({ x, y, label }) => {
      ctx.strokeStyle = "#5BA8A050";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#5BA8A0";
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y + 3);
      ctx.textAlign = "start";
    });
  }, [productName, productCategory, materials, requirements]);

  return (
    <div className={`relative ${className || ""}`}>
      <canvas
        ref={canvasRef}
        className="w-full aspect-square rounded-lg"
        style={{ minHeight: 200 }}
      />
    </div>
  );
}
