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
  /** Overall scale (1 = ~110px wide pair). */
  scale?: number;
};

const TEAL = "#5B8DA8";
const MAGENTA = "#D94F9C";
const SOLE = "#f2f2f4";
const SOLE_EDGE = "#bdbdc7";
const UPPER = "#ffffff";
const DIRT_BROWN = "rgba(55, 40, 28, 0.75)";

function drawAnkle(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.strokeStyle = "#d4a574";
  ctx.lineWidth = 2.5 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y - 18 * scale);
  ctx.lineTo(x, y - 4 * scale);
  ctx.stroke();
  ctx.fillStyle = "#c4926a";
  ctx.beginPath();
  ctx.arc(x, y - 20 * scale, 3 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSingleSneaker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  lift: number,
  dirt: number,
  showAnkle: boolean,
) {
  ctx.save();
  ctx.translate(x, y - lift * scale);
  ctx.scale(scale, scale);

  if (showAnkle) drawAnkle(ctx, 18, -2, 1);

  // Outsole
  ctx.fillStyle = SOLE_EDGE;
  ctx.beginPath();
  ctx.moveTo(-2, 4);
  ctx.quadraticCurveTo(20, 10, 46, 5);
  ctx.lineTo(46, 2);
  ctx.lineTo(-2, 2);
  ctx.closePath();
  ctx.fill();

  // Midsole
  ctx.fillStyle = SOLE;
  ctx.fillRect(0, 0, 44, 5);

  // Upper — classic runner shape (no wheels, no bubble hull)
  ctx.fillStyle = UPPER;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(4, -14);
  ctx.quadraticCurveTo(12, -22, 24, -20);
  ctx.quadraticCurveTo(38, -18, 42, -6);
  ctx.lineTo(42, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#dddde3";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Teal side stripe (swoosh-like)
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(8, -4);
  ctx.quadraticCurveTo(22, -10, 36, -6);
  ctx.stroke();

  // Magenta heel clip
  ctx.fillStyle = MAGENTA;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -12);
  ctx.lineTo(8, -10);
  ctx.lineTo(8, 0);
  ctx.closePath();
  ctx.fill();

  // Toe bumper
  ctx.fillStyle = TEAL;
  ctx.beginPath();
  ctx.ellipse(40, -4, 5, 4, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Laces
  ctx.strokeStyle = "#888894";
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 3; i++) {
    const lx = 14 + i * 6;
    ctx.beginPath();
    ctx.moveTo(lx, -16);
    ctx.lineTo(lx + 4, -11);
    ctx.stroke();
  }

  if (dirt > 0.02) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = `rgba(55, 40, 28, ${0.1 + dirt * 0.45})`;
    ctx.fillRect(-2, -22, 48, 26);
    ctx.fillStyle = DIRT_BROWN;
    for (let i = 0; i < Math.floor(dirt * 5); i++) {
      ctx.beginPath();
      ctx.ellipse(10 + ((i * 11) % 30), -8 - ((i * 5) % 8), 3 + (i % 2), 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.restore();
}

/**
 * Draw a pair of sneakers in a running/walking stride (side view, facing right).
 * `x,y` is the ground contact near the trail shoe.
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

  if (opts.freshGlow) {
    ctx.save();
    ctx.fillStyle = "rgba(126,200,217,0.15)";
    ctx.beginPath();
    ctx.ellipse(x + 48 * scale, y - 14 * scale, 58 * scale, 24 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (opts.airborne) {
    drawSingleSneaker(ctx, x + 6 * scale, y + 1, scale * 0.95, 16, opts.dirt, true);
    drawSingleSneaker(ctx, x + 32 * scale, y + 3, scale * 0.9, 12, opts.dirt * 0.9, true);
  } else {
    const leadLift = Math.max(0, stride) * 12;
    const trailLift = Math.max(0, -stride) * 12;
    const leadX = x + (stride > 0 ? 18 : 4) * scale;
    const trailX = x + (stride > 0 ? -2 : 14) * scale;

    drawSingleSneaker(ctx, trailX, y + 4, scale * 0.92, trailLift, opts.dirt, true);
    drawSingleSneaker(ctx, leadX, y, scale, leadLift, opts.dirt, true);
  }

  return { width: 110 * scale, height: 42 * scale };
}
