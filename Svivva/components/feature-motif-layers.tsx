"use client";

import { useRef, useEffect } from "react";

export type MotifId = "waveform" | "branching" | "web" | "seal" | "packaging" | "crystal";

function syncCanvasSize(cv: HTMLCanvasElement): boolean {
  const w = cv.offsetWidth;
  const h = cv.offsetHeight;
  if (w <= 0 || h <= 0) return false;
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
  }
  return true;
}

function useMotifCanvas(
  drawFrame: (ctx: CanvasRenderingContext2D, cv: HTMLCanvasElement, t: number) => void,
  deps: unknown[],
) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let t = 0;
    let raf = 0;
    let inView = true;
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            inView = Boolean(entry?.isIntersecting);
          }, { threshold: 0 })
        : null;
    io?.observe(cv);
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (document.hidden || !inView) return;
      if (!syncCanvasSize(cv)) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      drawFrame(ctx, cv, t);
      t += 1;
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawFrame identity follows deps
  }, deps);
  return cvRef;
}

function WaveformLayer({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const cvRef = useMotifCanvas(
    (ctx, cv, t) => {
      const lines = 8;
      for (let l = 0; l < lines; l++) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.globalAlpha = (0.12 - l * 0.012) * opacity;
        ctx.lineWidth = 1.5;
        const amp = 12 + l * 8;
        const freq = 0.018 + l * 0.004;
        const speed = 0.04 + l * 0.01;
        const yBase = cv.height * 0.3 + l * (cv.height * 0.06);
        for (let x = 0; x < cv.width; x++) {
          const y = yBase + Math.sin(x * freq + t * speed + l * 0.5) * amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      const scanX = (t * 2) % cv.width;
      const grad = ctx.createLinearGradient(scanX - 1, 0, scanX + 1, 0);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, "transparent");
      ctx.globalAlpha = 0.18 * opacity;
      ctx.fillStyle = grad;
      ctx.fillRect(scanX - 1, 0, 2, cv.height);
    },
    [color, opacity],
  );
  return (
    <canvas
      ref={cvRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ pointerEvents: "none" }}
    />
  );
}

function BranchingLayer({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const nodesRef = useRef(
    Array.from({ length: 7 }, (_, i) => ({
      x: 0.5,
      y: 0.5,
      angle: (i / 7) * Math.PI * 2,
      len: 0.15 + Math.random() * 0.1,
    })),
  );
  const cvRef = useMotifCanvas(
    (ctx, cv, t) => {
      const nodes = nodesRef.current;
      const cx = cv.width * 0.5;
      const cy = cv.height * 0.5;
      nodes.forEach((n, i) => {
        const pulseLen = n.len * (1 + 0.12 * Math.sin(t * 0.03 + i));
        const ex = cx + Math.cos(n.angle) * cv.width * pulseLen;
        const ey = cy + Math.sin(n.angle) * cv.height * pulseLen;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.22 * opacity;
        ctx.lineWidth = 1;
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3 * opacity;
        ctx.fill();
      });
      const r = 4 + 3 * Math.sin(t * 0.04);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.28 * opacity;
      ctx.fill();
    },
    [color, opacity],
  );
  return (
    <canvas
      ref={cvRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ pointerEvents: "none" }}
    />
  );
}

function WebLayer({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const ptsRef = useRef(
    Array.from({ length: 9 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0005,
      vy: (Math.random() - 0.5) * 0.0005,
    })),
  );
  const cvRef = useMotifCanvas(
    (ctx, cv, t) => {
      const pts = ptsRef.current;
      pts.forEach((p) => {
        p.x = (p.x + p.vx + 1) % 1;
        p.y = (p.y + p.vy + 1) % 1;
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = (pts[i].x - pts[j].x) * cv.width;
          const dy = (pts[i].y - pts[j].y) * cv.height;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < cv.width * 0.35) {
            ctx.globalAlpha = 0.15 * (1 - dist / (cv.width * 0.35)) * opacity;
            ctx.beginPath();
            ctx.moveTo(pts[i].x * cv.width, pts[i].y * cv.height);
            ctx.lineTo(pts[j].x * cv.width, pts[j].y * cv.height);
            ctx.stroke();
          }
        }
      }
      const pulse = 20 + 15 * Math.sin(t * 0.03);
      ctx.beginPath();
      ctx.arc(cv.width * 0.5, cv.height * 0.35, pulse, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.08 * opacity;
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    [color, opacity],
  );
  return (
    <canvas
      ref={cvRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ pointerEvents: "none" }}
    />
  );
}

function SealLayer({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const cvRef = useMotifCanvas(
    (ctx, cv, t) => {
      const progress = Math.sin(t * 0.015) * 0.5 + 0.5;
      const perim = 2 * (cv.width + cv.height);
      const drawn = perim * progress;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.22 * opacity;
      ctx.lineWidth = 1.5;
      const pad = 16;
      let rem = drawn;
      const top = Math.min(rem, cv.width - 2 * pad);
      ctx.moveTo(pad, pad);
      ctx.lineTo(pad + top, pad);
      rem -= top;
      if (rem > 0) {
        const right = Math.min(rem, cv.height - 2 * pad);
        ctx.lineTo(cv.width - pad, pad + right);
        rem -= right;
      }
      if (rem > 0) {
        const bottom = Math.min(rem, cv.width - 2 * pad);
        ctx.lineTo(cv.width - pad - bottom, cv.height - pad);
        rem -= bottom;
      }
      if (rem > 0) {
        ctx.lineTo(pad, cv.height - pad - rem);
      }
      ctx.stroke();
      [
        [pad, pad],
        [cv.width - pad, pad],
        [pad, cv.height - pad],
        [cv.width - pad, cv.height - pad],
      ].forEach(([x, y]) => {
        const s = 3 + 1.5 * Math.sin(t * 0.04);
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x - s, y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35 * opacity;
        ctx.fill();
      });
    },
    [color, opacity],
  );
  return (
    <canvas
      ref={cvRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ pointerEvents: "none" }}
    />
  );
}

function PackagingLayer({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const cvRef = useMotifCanvas(
    (ctx, cv, t) => {
      const cols = 3;
      const rows = 3;
      const panelW = cv.width / cols;
      const panelH = cv.height / rows;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      for (let r = 0; r <= rows; r++) {
        ctx.globalAlpha = (0.12 + 0.08 * Math.sin(t * 0.03 + r * 0.5)) * opacity;
        ctx.beginPath();
        ctx.moveTo(0, r * panelH);
        ctx.lineTo(cv.width, r * panelH);
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.globalAlpha = (0.12 + 0.08 * Math.sin(t * 0.03 + c * 0.7)) * opacity;
        ctx.beginPath();
        ctx.moveTo(c * panelW, 0);
        ctx.lineTo(c * panelW, cv.height);
        ctx.stroke();
      }
      const sweepX = ((t * 1.5) % (cv.width + 60)) - 30;
      const g = ctx.createLinearGradient(sweepX - 20, 0, sweepX + 20, 0);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, color);
      g.addColorStop(1, "transparent");
      ctx.globalAlpha = 0.1 * opacity;
      ctx.fillStyle = g;
      ctx.fillRect(sweepX - 20, 0, 40, cv.height);
    },
    [color, opacity],
  );
  return (
    <canvas
      ref={cvRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ pointerEvents: "none" }}
    />
  );
}

function CrystalLayer({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const crystalsRef = useRef([
    { x: 0.72, y: 0.78, r: 0 },
    { x: 0.15, y: 0.62, r: Math.PI / 4 },
  ]);
  const cvRef = useMotifCanvas(
    (ctx, cv, t) => {
      const crystals = crystalsRef.current;
      const s = Math.min(cv.width, cv.height) * 0.12;
      crystals.forEach((c, i) => {
        c.r += 0.004 + i * 0.002;
        const cx = c.x * cv.width;
        const cy = c.y * cv.height;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(c.r);
        const pts = [
          [0, -s * 1.4],
          [s, 0],
          [0, s * 0.9],
          [-s, 0],
        ];
        ctx.beginPath();
        pts.forEach(([px, py], idx) => (idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.3 * opacity;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        const g = ctx.createLinearGradient(-s, -s, s, s);
        g.addColorStop(0, "transparent");
        g.addColorStop(0.5, color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.globalAlpha = (0.06 + 0.04 * Math.sin(t * 0.05)) * opacity;
        ctx.fill();
        ctx.restore();
      });
    },
    [color, opacity],
  );
  return (
    <canvas
      ref={cvRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ pointerEvents: "none" }}
    />
  );
}

export const MOTIF_LAYERS: Record<MotifId, React.FC<{ color: string; opacity?: number }>> = {
  waveform: WaveformLayer,
  branching: BranchingLayer,
  web: WebLayer,
  seal: SealLayer,
  packaging: PackagingLayer,
  crystal: CrystalLayer,
};
