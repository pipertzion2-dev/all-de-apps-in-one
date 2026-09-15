"use client";

import type { HudShoeSnapshot } from "@/lib/clean-sneaks/types";
import { DIRT_ZONES, ZONE_LABELS } from "@/lib/clean-sneaks/dirt-system";

type Props = {
  left: HudShoeSnapshot;
  right: HudShoeSnapshot;
  compact?: boolean;
};

/** Tiny shoe-cam HUD — dirt appears on the model, not a giant health bar. */
export function ShoeCamHud({ left, right, compact }: Props) {
  return (
    <div
      className={`pointer-events-none flex items-end gap-2 ${compact ? "scale-90 origin-bottom-left" : ""}`}
      data-testid="shoe-cam-hud"
      aria-label="Sneaker condition"
    >
      <ShoeGlyph snap={left} />
      <ShoeGlyph snap={right} />
    </div>
  );
}

function ShoeGlyph({ snap }: { snap: HudShoeSnapshot }) {
  const clean = Math.round(snap.cleanliness);
  const tone =
    clean >= 80
      ? "#7EC8D9"
      : clean >= 60
        ? "#5B8DA8"
        : clean >= 40
          ? "#c4a35a"
          : clean >= 20
            ? "#d4782a"
            : "#D94F9C";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/50">
        {snap.side === "left" ? "L" : "R"}
      </span>
      <svg width="52" height="72" viewBox="0 0 52 72" className="drop-shadow-md" aria-hidden>
        {/* Outsole */}
        <rect
          x="8"
          y="58"
          width="36"
          height="8"
          rx="2"
          fill={snap.zones.outsole.color ?? "#1a1e24"}
          opacity={0.35 + snap.zones.outsole.amount / 140}
        />
        {/* Midsole */}
        <rect
          x="10"
          y="50"
          width="32"
          height="9"
          rx="2"
          fill={snap.zones.midsole.color ?? "#e8e8ec"}
          opacity={0.45 + snap.zones.midsole.amount / 160}
        />
        {/* Heel */}
        <rect
          x="30"
          y="28"
          width="14"
          height="24"
          rx="3"
          fill={snap.zones.heel.color ?? "#f2f2f6"}
          opacity={0.5 + snap.zones.heel.amount / 150}
        />
        {/* Body / sides */}
        <path
          d="M12 48 L10 30 Q12 18 22 14 L34 12 Q42 14 44 28 L42 48 Z"
          fill={snap.zones.leftSide.color ?? snap.zones.rightSide.color ?? "#fafafa"}
          opacity={0.55 + Math.max(snap.zones.leftSide.amount, snap.zones.rightSide.amount) / 160}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.6"
        />
        {/* Toe box */}
        <ellipse
          cx="18"
          cy="22"
          rx="10"
          ry="8"
          fill={snap.zones.toeBox.color ?? "#ffffff"}
          opacity={0.5 + snap.zones.toeBox.amount / 140}
        />
        {/* Tongue */}
        <rect
          x="20"
          y="16"
          width="10"
          height="14"
          rx="2"
          fill={snap.zones.tongue.color ?? "#ececf0"}
          opacity={0.55 + snap.zones.tongue.amount / 150}
        />
        {/* Laces */}
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1="22"
            y1={20 + i * 4}
            x2="30"
            y2={20 + i * 4}
            stroke={snap.zones.laces.color ?? "#2a3038"}
            strokeWidth={1.2}
            opacity={0.4 + snap.zones.laces.amount / 120}
          />
        ))}
        {/* Wet shimmer */}
        {DIRT_ZONES.some((z) => snap.zones[z].wetness > 15) && (
          <ellipse cx="26" cy="36" rx="14" ry="6" fill="#3a7ca5" opacity={0.18} />
        )}
        {/* Crease marks */}
        {snap.creases > 8 && (
          <path
            d="M14 28 Q18 26 22 28"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth={0.8}
            opacity={Math.min(0.7, snap.creases / 80)}
          />
        )}
      </svg>
      <span className="text-[10px] font-bold tabular-nums" style={{ color: tone }}>
        {clean}%
      </span>
      <span className="sr-only">
        {snap.side} shoe {clean}% clean.
        {DIRT_ZONES.filter((z) => snap.zones[z].amount > 5)
          .map((z) => `${ZONE_LABELS[z]} dirty`)
          .join(", ")}
      </span>
    </div>
  );
}
