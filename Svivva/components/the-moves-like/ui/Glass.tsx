"use client";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Clear colored glass for light ZZAI UI —
 * mostly transparent white frost with soft teal / magenta tint.
 * Always reads light even when the rest of the site is .dark.
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
      ? "border-[rgba(91,141,168,0.28)] bg-[rgba(232,244,248,0.55)] shadow-[0_8px_28px_rgba(91,141,168,0.08)]"
      : tint === "magenta"
        ? "border-[rgba(196,74,154,0.3)] bg-[rgba(252,240,248,0.58)] shadow-[0_8px_28px_rgba(196,74,154,0.08)]"
        : tint === "ink"
          ? "border-[rgba(15,26,28,0.12)] bg-[rgba(255,255,255,0.72)] shadow-[0_10px_32px_rgba(15,26,28,0.06)]"
          : "border-[rgba(15,26,28,0.1)] bg-[rgba(255,255,255,0.48)] shadow-[0_8px_28px_rgba(15,26,28,0.05)]";

  return (
    <div
      className={cn(
        "rounded-2xl border text-[hsl(180_20%_10%)] backdrop-blur-xl [-webkit-backdrop-filter:blur(18px)]",
        tintClass,
        padding && "p-4 sm:p-5",
        className,
      )}
    >
      {children}
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
        "min-h-10 shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] backdrop-blur-md [-webkit-backdrop-filter:blur(12px)] transition",
        active
          ? "border-[rgba(91,141,168,0.45)] bg-[rgba(91,141,168,0.18)] text-[hsl(180_20%_12%)]"
          : "border-[rgba(15,26,28,0.14)] bg-[rgba(255,255,255,0.62)] text-[hsl(180_10%_38%)] hover:border-[rgba(91,141,168,0.4)] hover:bg-[rgba(91,141,168,0.1)] hover:text-[hsl(180_20%_12%)]",
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
          "min-h-11 backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]",
          variant === "outline" &&
            "border-[rgba(15,26,28,0.16)] bg-[rgba(255,255,255,0.7)] text-[hsl(180_20%_12%)] hover:bg-[rgba(255,255,255,0.88)] hover:text-[hsl(180_20%_12%)]",
          variant === "secondary" && "bg-secondary/90",
          variant === "ghost" &&
            "text-[hsl(197_45%_38%)] hover:bg-[rgba(91,141,168,0.1)] hover:text-[hsl(180_20%_12%)]",
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
        "min-h-11 border-primary-border bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(91,141,168,0.25)]",
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
        "min-h-11 border border-[hsl(315_55%_55%/0.35)] bg-[hsl(315_55%_42%)] text-white shadow-[0_8px_28px_rgba(196,74,154,0.28)] hover:brightness-105",
        className,
      )}
      {...props}
    />
  );
}

/** Frosted white dock over camera / stage — stays light even over a black video feed. */
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
        "rounded-2xl border border-[rgba(255,255,255,0.85)] bg-[rgba(255,255,255,0.78)] p-3 text-[hsl(180_20%_10%)] shadow-[0_14px_36px_rgba(15,26,28,0.14)] backdrop-blur-xl [-webkit-backdrop-filter:blur(20px)] sm:p-4",
        "ring-1 ring-inset ring-[rgba(91,141,168,0.14)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
