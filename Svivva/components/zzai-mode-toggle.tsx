"use client";

import Image from "next/image";
import { usePlatform } from "@/lib/platform-context";
import zzaiLogo from "@/attached_assets/ZZAI_OFFICIAL_LOGO.png";

type Props = {
  size?: "sm" | "md";
  className?: string;
  showLabels?: boolean;
};

/**
 * Crest ↔ Signal using the real ZZAI crest logo.
 * Signal = cyan treatment (digital / Prompt → API).
 * Crest = magenta treatment (physical / manufacturing).
 */
export function ZzaiModeToggle({ size = "sm", className = "", showLabels = false }: Props) {
  const { mode, setMode, colors } = usePlatform();
  const isSignal = mode === "digital";
  const dim = size === "sm" ? 32 : 44;

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
      <ModeButton
        active={isSignal}
        onClick={() => setMode("digital")}
        title="Signal — Prompt to API"
        testId="button-platform-toggle-signal"
        dim={dim}
        accent="#00E5FF"
        glow="rgba(0, 229, 255, 0.55)"
        filter="brightness(1.08) saturate(1.25) hue-rotate(-8deg)"
        showLabels={showLabels}
        label="Signal"
        subtitle="Prompt → API"
      />
      <ModeButton
        active={!isSignal}
        onClick={() => setMode("physical")}
        title="Crest — Manufacturing"
        testId="button-platform-toggle-crest"
        dim={dim}
        accent="#FF2BD6"
        glow="rgba(255, 43, 214, 0.55)"
        filter="brightness(1.05) saturate(1.35) hue-rotate(12deg)"
        showLabels={showLabels}
        label="Crest"
        subtitle="Manufacture"
      />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  testId,
  dim,
  accent,
  glow,
  filter,
  showLabels,
  label,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  testId: string;
  dim: number;
  accent: string;
  glow: string;
  filter: string;
  showLabels: boolean;
  label: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      data-testid={testId}
      className="relative flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-all duration-300 focus:outline-none"
      style={{
        opacity: active ? 1 : 0.4,
        background: active ? `${accent}14` : "transparent",
        boxShadow: active ? `0 0 0 1px ${accent}73, 0 0 14px ${glow}` : "none",
      }}
    >
      <span
        className="relative flex items-center justify-center overflow-hidden rounded-md"
        style={{
          width: dim,
          height: dim,
          boxShadow: active ? `0 0 12px ${glow}` : "none",
        }}
      >
        <Image
          src={zzaiLogo}
          alt=""
          width={dim}
          height={dim}
          className="object-contain transition-[filter,transform] duration-300"
          style={{
            filter: active ? filter : "grayscale(0.35) brightness(0.75)",
            transform: active ? "scale(1.04)" : "scale(0.96)",
          }}
          aria-hidden
        />
      </span>
      {showLabels && (
        <span className="pr-1 text-left leading-tight">
          <span className="block text-[11px] font-semibold text-foreground">{label}</span>
          <span className="block text-[9px] text-muted-foreground">{subtitle}</span>
        </span>
      )}
    </button>
  );
}
