/**
 * WireBar — concertina razor-wire with genuine 3D helix twist.
 *
 * Each coil is a circle in 3D, projected onto the screen.
 * A global rotation angle (driven by scroll) advances per-coil phase offsets
 * staggered by horizontal position — so the coils appear to spin in a
 * continuous helical twist as you scroll, not just slide sideways.
 *
 * Rendering: 3-pass painter's algorithm (back arcs → spikes → front arcs)
 * gives convincing depth. Spikes are brightness-modulated by z-depth.
 * 2D canvas — no WebGL, zero GPU context usage.
 */
import { useEffect, useRef } from "react";

// ── Geometry (in CSS px, scaled by DPR) ──────────────────────────────────
const COIL_RY = 0.41; // as fraction of canvas height
const COIL_RX_RATIO = 1.14; // slightly oval (wider than tall)
const SPACING_RATIO = 0.58; // fraction of RX between coil centres
const N_SPIKES = 24; // blades per coil
const SPIKE_LEN_F = 0.095; // spike length as fraction of height
const WIRE_THICK_F = 3.4; // front arc stroke width (px)
const WIRE_THIN_B = 1.8; // back arc stroke width (px)

// Helix: how fast phase changes per horizontal pixel
const HELIX_PITCH = 0.055; // radians / px of coil X position
// Scroll → global rotation rate
const SCROLL_RATE = 0.004; // radians per px of scroll

// ── Colour palette ────────────────────────────────────────────────────────
const METAL_HI = [228, 218, 185]; // bright metallic highlight (RGB)
const METAL_MID = [160, 152, 122]; // mid tone
const METAL_SHD = [75, 72, 55]; // shadow

function rgba(r, g, b, a) {
  return `rgba(${r},${g},${b},${a})`;
}
function mix([r1, g1, b1], [r2, g2, b2], t) {
  return [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t];
}

// ── Draw a single razor-blade spike ──────────────────────────────────────
function drawSpike(ctx, px, py, ux, uy, spikeLen, brightness) {
  const tx = px + ux * spikeLen;
  const ty = py + uy * spikeLen;
  const bw = 2.6;
  const bx = -uy * bw;
  const by = ux * bw;

  const hiCol = mix(METAL_SHD, METAL_HI, 0.4 + brightness * 0.6);
  const shdCol = mix(METAL_SHD, METAL_MID, brightness * 0.4);

  const g = ctx.createLinearGradient(px, py, tx, ty);
  g.addColorStop(0, rgba(...hiCol, 0.92));
  g.addColorStop(0.55, rgba(...METAL_MID, 0.85));
  g.addColorStop(1, rgba(...shdCol, 0.68));

  ctx.beginPath();
  ctx.moveTo(px + bx, py + by);
  ctx.lineTo(tx, ty);
  ctx.lineTo(px - bx, py - by);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(...METAL_SHD, 0.45);
  ctx.lineWidth = 0.35;
  ctx.stroke();
}

// ── Draw one coil for the given pass, with 3D helix rotation ─────────────
//   theta  = rotation of this coil around its horizontal centre axis
//   pass   = 'back' | 'spikes' | 'front'
function drawCoil(ctx, cx, cy, rx, ryFull, spikeLen, theta, pass) {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const ryP = Math.abs(cosT) * ryFull; // projected vertical radius

  // Which arc is "front" (closer to viewer)?
  // When cosT >= 0: the bottom semicircle (angles 0→π) is front
  // When cosT <  0: the top semicircle (angles π→2π) is front
  const frontStart = cosT >= 0 ? 0 : Math.PI;
  const frontEnd = cosT >= 0 ? Math.PI : Math.PI * 2;
  const backStart = cosT >= 0 ? Math.PI : 0;
  const backEnd = cosT >= 0 ? Math.PI * 2 : Math.PI;

  if (pass === "back") {
    if (ryP < 1) return; // edge-on — skip
    const g = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
    g.addColorStop(0, rgba(...METAL_SHD, 0.38));
    g.addColorStop(0.5, rgba(...METAL_MID, 0.55));
    g.addColorStop(1, rgba(...METAL_SHD, 0.38));
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ryP, 0, backStart, backEnd, false);
    ctx.strokeStyle = g;
    ctx.lineWidth = WIRE_THIN_B;
    ctx.stroke();
    return;
  }

  if (pass === "spikes") {
    // Project each spike using the same rotation
    for (let i = 0; i < N_SPIKES; i++) {
      const a = (i / N_SPIKES) * Math.PI * 2;

      // 3D point on coil surface (unit circle, then stretched)
      const px3 = Math.cos(a); // x
      const py3 = Math.sin(a) * cosT; // y after rotation (projected)
      const pz3 = Math.sin(a) * sinT; // z (depth — positive = toward viewer)

      // Screen position
      const sx = cx + px3 * rx;
      const sy = cy + py3 * ryFull; // use ryFull for consistent spike spacing

      // Outward direction on the projected ellipse
      const dx = px3 * rx;
      const dy = py3 * ryFull;
      const d = Math.hypot(dx, dy);
      if (d < 0.01) continue;
      const ux = dx / d;
      const uy = dy / d;

      // Brightness: 0 (pointing away) → 1 (pointing straight at viewer)
      const brightness = 0.35 + 0.65 * Math.max(0, pz3);

      drawSpike(ctx, sx, sy, ux, uy, spikeLen, brightness);
    }
    return;
  }

  if (pass === "front") {
    if (ryP < 1) {
      // Nearly edge-on — draw a bright line
      const g = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
      g.addColorStop(0, rgba(...METAL_SHD, 0.7));
      g.addColorStop(0.25, rgba(...METAL_HI, 0.97));
      g.addColorStop(0.75, rgba(...METAL_HI, 0.97));
      g.addColorStop(1, rgba(...METAL_SHD, 0.7));
      ctx.beginPath();
      ctx.moveTo(cx - rx, cy);
      ctx.lineTo(cx + rx, cy);
      ctx.strokeStyle = g;
      ctx.lineWidth = WIRE_THICK_F;
      ctx.stroke();
      return;
    }

    const g = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
    g.addColorStop(0, rgba(...METAL_SHD, 0.88));
    g.addColorStop(0.22, rgba(...METAL_HI, 0.98));
    g.addColorStop(0.78, rgba(...METAL_HI, 0.98));
    g.addColorStop(1, rgba(...METAL_SHD, 0.88));
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ryP, 0, frontStart, frontEnd, false);
    ctx.strokeStyle = g;
    ctx.lineWidth = WIRE_THICK_F;
    ctx.stroke();

    // Glint highlight
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.82, ryP * 0.65, 0, frontStart + 0.15, frontEnd - 0.15, false);
    ctx.strokeStyle = rgba(255, 248, 220, 0.12);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ── Main render ────────────────────────────────────────────────────────────
function renderFrame(ctx, cssW, cssH, scrollOffset, bgColor) {
  ctx.clearRect(0, 0, cssW, cssH);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, cssH);
  bg.addColorStop(0, bgColor);
  bg.addColorStop(0.45, "#0e0c1c");
  bg.addColorStop(1, bgColor);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const cy = cssH / 2;
  const ryFull = cssH * COIL_RY;
  const rx = ryFull * COIL_RX_RATIO;
  const spacing = rx * SPACING_RATIO;
  const spikeLen = cssH * SPIKE_LEN_F;

  // Global rotation angle from scroll
  const globalTheta = scrollOffset * SCROLL_RATE;

  // Horizontal slide from scroll (much slower than the twist)
  const slideX = scrollOffset * 0.08;

  // Coil positions
  const startX = (slideX % spacing) - spacing * 3;
  const coils = [];
  for (let x = startX; x < cssW + spacing * 2; x += spacing) {
    // Each coil has its own twist phase (helix effect)
    const theta = globalTheta + x * HELIX_PITCH;
    coils.push({ x, theta });
  }

  // Painter's algorithm — 3 passes
  for (const { x, theta } of coils) drawCoil(ctx, x, cy, rx, ryFull, spikeLen, theta, "back");
  for (const { x, theta } of coils) drawCoil(ctx, x, cy, rx, ryFull, spikeLen, theta, "spikes");
  for (const { x, theta } of coils) drawCoil(ctx, x, cy, rx, ryFull, spikeLen, theta, "front");

  // Fade top + bottom into page bg
  const fadeH = cssH * 0.28;
  const ft = ctx.createLinearGradient(0, 0, 0, fadeH);
  ft.addColorStop(0, bgColor);
  ft.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ft;
  ctx.fillRect(0, 0, cssW, fadeH);

  const fb = ctx.createLinearGradient(0, cssH - fadeH, 0, cssH);
  fb.addColorStop(0, "rgba(0,0,0,0)");
  fb.addColorStop(1, bgColor);
  ctx.fillStyle = fb;
  ctx.fillRect(0, cssH - fadeH, cssW, fadeH);
}

// ── React component ────────────────────────────────────────────────────────
export function WireBar({ height = 96, bgColor = "#08080e" }) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cssW = 0,
      cssH = 0;
    let animId = null;
    let curScroll = window.scrollY;
    let tgtScroll = window.scrollY;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = canvas.offsetWidth;
      cssH = canvas.offsetHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderFrame(ctx, cssW, cssH, curScroll, bgColor);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    resize();

    const onScroll = () => {
      tgtScroll = window.scrollY;
      if (!animId) tick();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      const diff = tgtScroll - curScroll;
      if (Math.abs(diff) < 0.3) {
        curScroll = tgtScroll;
        renderFrame(ctx, cssW, cssH, curScroll, bgColor);
        animId = null;
        return;
      }
      curScroll += diff * 0.13;
      renderFrame(ctx, cssW, cssH, curScroll, bgColor);
      animId = requestAnimationFrame(tick);
    };

    return () => {
      if (animId) cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [bgColor]);

  return (
    <div style={{ position: "relative", width: "100%", height, overflow: "hidden", flexShrink: 0 }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

      {/* Military camo colour wash — earth tones, overlay blend mode */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: `
          radial-gradient(ellipse at  8% 45%, rgba(55,72,28,0.68) 0%, transparent 28%),
          radial-gradient(ellipse at 26% 68%, rgba(70,86,34,0.55) 0%, transparent 22%),
          radial-gradient(ellipse at 48% 28%, rgba(44,62,20,0.60) 0%, transparent 26%),
          radial-gradient(ellipse at 70% 58%, rgba(62,78,30,0.52) 0%, transparent 24%),
          radial-gradient(ellipse at 90% 35%, rgba(50,66,24,0.58) 0%, transparent 22%),
          radial-gradient(ellipse at 40% 82%, rgba(36,54,16,0.46) 0%, transparent 20%)
        `,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
