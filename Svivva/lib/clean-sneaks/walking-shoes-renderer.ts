/** Side-profile sneaker pair drawn on canvas — reads as shoes walking, not the Baloon8 car-shoe. */

export type WalkingShoesOptions = {
  /** 0–1 stride cycle (alternates left/right lead). */
  walkPhase: number;
  /** True when the player is jumping. */
  airborne: boolean;
  /** 0 = spotless, 1 = filthy */
  dirt: number;
  /** Subtle fresh glow when cleanliness is high. */
  freshGlow?: boolean;
  /** Overall scale (1 = ~100px wide pair). */
  scale?: number;
};

const TEAL = "#5B8DA8";
const TEAL_DARK = "#3d6a7f";
const MAGENTA = "#D94F9C";
const SOLE = "#1a1a1e";
const LACE = "#e8e8ec";
const DIRT_BROWN = "rgba(55, 40, 28, 0.75)";

function drawSingleSneaker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  facing: 1 | -1,
  lift: number,
  dirt: number,
) {
  ctx.save();
  ctx.translate(x, y - lift * scale);
  ctx.scale(facing * scale, scale);

  // Sole
  ctx.fillStyle = SOLE;
  ctx.beginPath();
  ctx.moveTo(-4, 2);
  ctx.quadraticCurveTo(18, 8, 42, 4);
  ctx.quadraticCurveTo(48, 3, 50, 0);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fill();

  // Midsole stripe
  ctx.fillStyle = TEAL;
  ctx.fillRect(-2, -2, 44, 4);

  // Upper
  const upper = ctx.createLinearGradient(0, -22, 0, 0);
  upper.addColorStop(0, TEAL);
  upper.addColorStop(0.55, TEAL_DARK);
  upper.addColorStop(1, "#2a3540");
  ctx.fillStyle = upper;
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(6, -18);
  ctx.quadraticCurveTo(22, -24, 38, -16);
  ctx.quadraticCurveTo(46, -10, 44, 0);
  ctx.closePath();
  ctx.fill();

  // Toe cap
  ctx.fillStyle = MAGENTA;
  ctx.beginPath();
  ctx.ellipse(36, -8, 10, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Heel tab
  ctx.fillStyle = MAGENTA;
  ctx.fillRect(-4, -14, 6, 10);

  // Laces
  ctx.strokeStyle = LACE;
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const lx = 14 + i * 5;
    ctx.beginPath();
    ctx.moveTo(lx, -16);
    ctx.lineTo(lx + 3, -10);
    ctx.stroke();
  }

  // Collar lining
  ctx.strokeStyle = "rgba(126,200,217,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(8, -18);
  ctx.quadraticCurveTo(22, -22, 34, -17);
  ctx.stroke();

  if (dirt > 0.02) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = `rgba(55, 40, 28, ${0.12 + dirt * 0.5})`;
    ctx.fillRect(-6, -24, 54, 28);
    ctx.fillStyle = DIRT_BROWN;
    for (let i = 0; i < Math.floor(dirt * 6); i++) {
      ctx.beginPath();
      ctx.ellipse(8 + ((i * 13) % 34), -6 - ((i * 7) % 12), 4 + (i % 2) * 2, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.restore();
}

/**
 * Draw a pair of sneakers in a running/walking stride (side view, facing right).
 * `x,y` is the ground contact near the lead shoe heel.
 */
export function drawWalkingSneakerPair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: WalkingShoesOptions,
): { width: number; height: number } {
  const scale = opts.scale ?? 1;
  const phase = opts.airborne ? 0.25 : opts.walkPhase;
  const stride = Math.sin(phase * Math.PI * 2);
  const bob = opts.airborne ? 0 : Math.max(0, stride) * 3;

  if (opts.freshGlow) {
    ctx.save();
    ctx.fillStyle = "rgba(126,200,217,0.12)";
    ctx.beginPath();
    ctx.ellipse(x + 42 * scale, y - 12 * scale, 52 * scale, 22 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (opts.airborne) {
    // Jump: both shoes tucked, slightly overlapped
    drawSingleSneaker(ctx, x + 8 * scale, y, scale * 0.92, 1, 14 + bob, opts.dirt);
    drawSingleSneaker(ctx, x + 28 * scale, y + 2, scale * 0.88, 1, 10 + bob, opts.dirt * 0.9);
  } else {
    // Walk cycle: lead shoe forward + lifted, trail shoe back on ground
    const leadLift = Math.max(0, stride) * 9;
    const trailLift = Math.max(0, -stride) * 9;
    const leadX = x + (stride > 0 ? 14 : 0) * scale;
    const trailX = x + (stride > 0 ? -4 : 10) * scale;

    drawSingleSneaker(ctx, trailX, y + 3, scale * 0.9, 1, trailLift, opts.dirt);
    drawSingleSneaker(ctx, leadX, y, scale, 1, leadLift, opts.dirt);
  }

  return { width: 100 * scale, height: 36 * scale };
}
