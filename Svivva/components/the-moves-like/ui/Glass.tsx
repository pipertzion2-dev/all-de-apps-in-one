"use client";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Liquid glass shell — bright specular rim, clear fill, high saturate (not chalk frost). */
const GLASS_BASE =
  "relative isolate overflow-hidden rounded-2xl border border-white/80 text-[hsl(180_20%_12%)] backdrop-blur-[18px] backdrop-saturate-[1.9] [-webkit-backdrop-filter:blur(18px)_saturate(1.9)] shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(255,255,255,0.35),inset_1px_0_0_rgba(255,255,255,0.45),inset_-1px_0_0_rgba(255,255,255,0.2),0_8px_32px_rgba(109,145,179,0.14),0_20px_56px_rgba(15,26,28,0.08)]";

const BTN_SHELL =
  "relative isolate overflow-hidden min-h-11 rounded-2xl border backdrop-blur-[16px] backdrop-saturate-[1.85] [-webkit-backdrop-filter:blur(16px)_saturate(1.85)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.25),0_10px_28px_rgba(109,145,179,0.16)] transition hover:brightness-[1.06] active:brightness-[0.98]";

/** Moving liquid highlight stripe across glass surfaces. */
function LiquidSheen({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        "bg-[linear-gradient(115deg,transparent_0%,transparent_38%,rgba(255,255,255,0.55)_48%,rgba(255,255,255,0.12)_58%,transparent_72%)]",
        "opacity-70 mix-blend-soft-light",
        "tml-liquid-sheen",
        className,
      )}
    />
  );
}

/**
 * Glossy liquid glass — blue #6D91B3 / purple #AC81AF.
 * Wet specular edge + clear body, not dull matte frost.
 */
export function GlassPanel({
  children,
  className,
  tint = "clear",
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  tint?: "clear" | "teal" | "magenta" | "ink";
  padding?: boolean;
}) {
  const tintClass =
    tint === "teal"
      ? "border-[rgba(168,192,212,0.75)] bg-[linear-gradient(145deg,rgba(255,255,255,0.72)_0%,rgba(168,192,212,0.28)_42%,rgba(109,145,179,0.12)_100%)]"
      : tint === "magenta"
        ? "border-[rgba(212,192,214,0.75)] bg-[linear-gradient(145deg,rgba(255,255,255,0.72)_0%,rgba(212,192,214,0.3)_42%,rgba(172,129,175,0.14)_100%)]"
        : tint === "ink"
          ? "border-white/85 bg-[linear-gradient(160deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.28)_100%)]"
          : "border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.18)_55%,rgba(109,145,179,0.08)_100%)]";

  return (
    <div className={cn(GLASS_BASE, tintClass, padding && "p-4 sm:p-5", className)}>
      <LiquidSheen />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function GlassChip({
  children,
  active,
  className,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "relative isolate min-h-10 shrink-0 overflow-hidden rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] backdrop-blur-[14px] backdrop-saturate-[1.8] [-webkit-backdrop-filter:blur(14px)_saturate(1.8)] transition",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_22px_rgba(109,145,179,0.12)]",
        active
          ? "border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.7)_0%,rgba(109,145,179,0.32)_100%)] text-[hsl(209_28%_28%)]"
          : "border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.14)_100%)] text-[hsl(180_10%_38%)] hover:border-[rgba(168,192,212,0.85)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.65)_0%,rgba(109,145,179,0.2)_100%)] hover:text-[hsl(209_28%_28%)]",
        className,
      )}
    >
      <LiquidSheen className="opacity-55" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function GlassButtonInner({ className, variant = "default", children, ...props }: ButtonProps) {
  const glassFill =
    variant === "outline"
      ? "border-white/80 !bg-[linear-gradient(180deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.22)_100%)] text-[hsl(180_20%_12%)] hover:!bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(109,145,179,0.22)_100%)] hover:text-[hsl(180_20%_12%)]"
      : variant === "ghost"
        ? "border-white/55 !bg-[linear-gradient(180deg,rgba(255,255,255,0.4)_0%,rgba(109,145,179,0.12)_100%)] text-[#6D91B3] hover:!bg-[rgba(109,145,179,0.18)] hover:text-[hsl(209_28%_28%)]"
        : variant === "secondary"
          ? "border-white/75 !bg-[linear-gradient(180deg,rgba(255,255,255,0.65)_0%,rgba(109,145,179,0.26)_100%)] text-[hsl(209_28%_28%)]"
          : "border-white/70 !bg-[linear-gradient(180deg,rgba(200,218,232,0.72)_0%,rgba(109,145,179,0.55)_100%)] !text-white";

  return (
    <Button variant="ghost" className={cn(BTN_SHELL, glassFill, className)} {...props}>
      <LiquidSheen />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Button>
  );
}

export function GlassButton({ className, variant = "default", children, ...props }: ButtonProps) {
  return (
    <GlassButtonInner className={className} variant={variant} {...props}>
      {children}
    </GlassButtonInner>
  );
}

export function GlassMagentaButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        BTN_SHELL,
        "border-white/70 !bg-[linear-gradient(180deg,rgba(232,214,234,0.72)_0%,rgba(172,129,175,0.58)_100%)] !text-white",
        className,
      )}
      {...props}
    >
      <LiquidSheen />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Button>
  );
}

/** Glossy liquid glass dock — wet rim, clear body. */
export function GlassDock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        GLASS_BASE,
        "border-white/85 bg-[linear-gradient(165deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.22)_50%,rgba(109,145,179,0.14)_100%)] p-3 sm:p-4",
        className,
      )}
    >
      <LiquidSheen />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
