"use client";

import { usePlatform } from "@/lib/platform-context";

type Props = {
  size?: "sm" | "md";
  className?: string;
  showLabels?: boolean;
};

/**
 * Replaces the old Digital/Physical flower toggle.
 * Crest (magenta / ornate) ↔ Signal (cyan / glitch) — mirrors the ZZAI logo duality.
 * Still drives platform mode: Signal = digital APIs, Crest = physical/hardware.
 */
export function ZzaiModeToggle({ size = "sm", className = "", showLabels = false }: Props) {
  const { mode, setMode, colors } = usePlatform();
  const isSignal = mode === "digital";
  const dim = size === "sm" ? 28 : 36;

  return (
    <div
      className={`inline-flex items-center gap-1 p-0.5 rounded-lg border backdrop-blur-sm ${className}`}
      style={{
        borderColor: colors.primaryBorder,
        background: "rgba(0,0,0,0.35)",
        boxShadow: `0 0 16px ${colors.primaryBg}`,
      }}
      role="group"
      aria-label="ZZAI mode"
    >
      <button
        type="button"
        onClick={() => setMode("digital")}
        title="Signal — Prompt to API"
        data-testid="button-platform-toggle-signal"
        className="relative flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-all duration-300 focus:outline-none"
        style={{
          opacity: isSignal ? 1 : 0.45,
          background: isSignal ? "rgba(0, 229, 255, 0.12)" : "transparent",
          boxShadow: isSignal ? "0 0 0 1px rgba(0, 229, 255, 0.45)" : "none",
        }}
      >
        <span
          className="relative flex items-center justify-center overflow-hidden"
          style={{ width: dim, height: dim }}
        >
          <span
            aria-hidden
            className="zzai-glitch-bars absolute inset-0 rounded-sm"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.35) 2px, rgba(0,229,255,0.35) 3px)",
            }}
          />
          <span
            className="relative font-black tracking-tighter text-[10px] sm:text-[11px]"
            style={{
              color: "#00E5FF",
              textShadow: "0 0 8px rgba(0,229,255,0.8), 1px 0 #FF2BD6, -1px 0 #39FF14",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            ZZ
          </span>
        </span>
        {showLabels && (
          <span className="pr-1 text-left leading-tight">
            <span className="block text-[11px] font-semibold text-foreground">Signal</span>
            <span className="block text-[9px] text-muted-foreground">Prompt → API</span>
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setMode("physical")}
        title="Crest — Manufacturing"
        data-testid="button-platform-toggle-crest"
        className="relative flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-all duration-300 focus:outline-none"
        style={{
          opacity: !isSignal ? 1 : 0.45,
          background: !isSignal ? "rgba(255, 43, 214, 0.12)" : "transparent",
          boxShadow: !isSignal ? "0 0 0 1px rgba(255, 43, 214, 0.45)" : "none",
        }}
      >
        <span
          className="relative flex items-center justify-center"
          style={{ width: dim, height: dim }}
        >
          <svg viewBox="0 0 32 32" width={dim - 4} height={dim - 4} aria-hidden>
            <defs>
              <linearGradient id="zzaiCrestMetal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F5F7FA" />
                <stop offset="45%" stopColor="#C0C6CE" />
                <stop offset="100%" stopColor="#8A9199" />
              </linearGradient>
            </defs>
            <path
              d="M16 2 L26 6 V14 C26 21 21 26 16 30 C11 26 6 21 6 14 V6 Z"
              fill="url(#zzaiCrestMetal)"
              stroke="#FF2BD6"
              strokeWidth="0.6"
              opacity="0.95"
            />
            <path
              d="M16 7 L21 9 V14 C21 18 18.5 21 16 23 C13.5 21 11 18 11 14 V9 Z"
              fill="#1a0014"
              stroke="#00E5FF"
              strokeWidth="0.5"
            />
            <circle cx="16" cy="4" r="1.1" fill="#00E5FF" />
          </svg>
        </span>
        {showLabels && (
          <span className="pr-1 text-left leading-tight">
            <span className="block text-[11px] font-semibold text-foreground">Crest</span>
            <span className="block text-[9px] text-muted-foreground">Manufacture</span>
          </span>
        )}
      </button>
    </div>
  );
}
