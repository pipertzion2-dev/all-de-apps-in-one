"use client";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Shared glossy glass sheen — highlight edge + liquid blur (not matte frost). */
const GLASS_BASE =
  "rounded-2xl border border-white/55 text-[hsl(180_20%_12%)] backdrop-blur-xl backdrop-saturate-150 [-webkit-backdrop-filter:blur(22px)_saturate(1.5)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(255,255,255,0.12),0_10px_40px_rgba(15,26,28,0.08)]";

/**
 * Glossy translucent glass — blue #6D91B3 / purple #AC81AF.
 * Clear sheen + saturate, not matte chalk frost.
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
      ? "border-[rgba(109,145,179,0.35)] bg-[linear-gradient(145deg,rgba(255,255,255,0.55)_0%,rgba(109,145,179,0.18)_45%,rgba(109,145,179,0.08)_100%)]"
      : tint === "magenta"
        ? "border-[rgba(172,129,175,0.35)] bg-[linear-gradient(145deg,rgba(255,255,255,0.55)_0%,rgba(172,129,175,0.2)_45%,rgba(172,129,175,0.08)_100%)]"
        : tint === "ink"
          ? "border-white/60 bg-[linear-gradient(160deg,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.22)_100%)]"
          : "border-white/50 bg-[linear-gradient(160deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.12)_100%)]";

  return (
    <div className={cn(GLASS_BASE, tintClass, padding && "p-4 sm:p-5", className)}>{children}</div>
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
        "min-h-10 shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] backdrop-blur-lg backdrop-saturate-150 [-webkit-backdrop-filter:blur(14px)_saturate(1.4)] transition",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        active
          ? "border-[rgba(109,145,179,0.45)] bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(109,145,179,0.28)_100%)] text-[hsl(209_28%_28%)]"
          : "border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0.14)_100%)] text-[hsl(180_10%_38%)] hover:border-[rgba(109,145,179,0.4)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(109,145,179,0.16)_100%)] hover:text-[hsl(209_28%_28%)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GlassButton({ className, variant = "default", ...props }: ButtonProps) {
  if (variant === "outline" || variant === "ghost" || variant === "secondary") {
    return (
      <Button
        variant={variant}
        className={cn(
          "min-h-11 backdrop-blur-lg backdrop-saturate-150 [-webkit-backdrop-filter:blur(14px)_saturate(1.4)]",
          variant === "outline" &&
            "border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.18)_100%)] text-[hsl(180_20%_12%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0.28)_100%)] hover:text-[hsl(180_20%_12%)]",
          variant === "secondary" && "bg-secondary/90",
          variant === "ghost" &&
            "text-[#6D91B3] hover:bg-[rgba(109,145,179,0.12)] hover:text-[hsl(209_28%_28%)]",
          className,
        )}
        {...props}
      />
    );
  }
  return (
    <Button
      variant={variant}
      className={cn(
        "min-h-11 border border-white/40 bg-[linear-gradient(180deg,rgba(168,192,212,0.85)_0%,rgba(109,145,179,0.78)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_24px_rgba(109,145,179,0.28)] backdrop-blur-md hover:brightness-105",
        className,
      )}
      {...props}
    />
  );
}

export function GlassMagentaButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "min-h-11 border border-white/40 bg-[linear-gradient(180deg,rgba(212,192,214,0.88)_0%,rgba(172,129,175,0.8)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_28px_rgba(172,129,175,0.32)] backdrop-blur-md hover:brightness-105",
        className,
      )}
      {...props}
    />
  );
}

/** Glossy glass dock — specular edge, liquid blur, clear fill. */
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
        "border-white/65 bg-[linear-gradient(165deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.18)_55%,rgba(109,145,179,0.1)_100%)] p-3 sm:p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
