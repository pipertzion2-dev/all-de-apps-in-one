"use client";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Clear colored glass for light ZZAI UI —
 * mostly transparent white frost with soft teal / magenta tint.
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
      ? "border-primary/20 bg-[hsl(197_55%_96%/0.22)] shadow-[0_8px_28px_rgba(91,141,168,0.06)]"
      : tint === "magenta"
        ? "border-[hsl(315_55%_65%/0.28)] bg-[hsl(315_90%_98%/0.24)] shadow-[0_8px_28px_rgba(196,74,154,0.06)]"
        : tint === "ink"
          ? "border-border/35 bg-white/28 shadow-[0_10px_32px_rgba(15,26,28,0.05)]"
          : "border-border/25 bg-white/22 shadow-[0_8px_28px_rgba(15,26,28,0.04)]";

  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-xl [-webkit-backdrop-filter:blur(20px)]",
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
          ? "border-primary/45 bg-primary/15 text-foreground"
          : "border-border/50 bg-white/40 text-muted-foreground hover:border-primary/35 hover:bg-primary/8 hover:text-foreground",
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
            "border-border/70 bg-white/45 text-foreground hover:bg-white/70 hover:text-foreground",
          variant === "secondary" && "bg-secondary/90",
          variant === "ghost" && "text-foreground hover:bg-primary/10",
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

/** Frosted white dock over camera / stage — stays readable without going black. */
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
        "rounded-2xl border border-white/75 bg-white/28 p-3 shadow-[0_12px_32px_rgba(15,26,28,0.08)] backdrop-blur-xl [-webkit-backdrop-filter:blur(18px)] sm:p-4",
        "ring-1 ring-inset ring-primary/10",
        className,
      )}
    >
      {children}
    </div>
  );
}
