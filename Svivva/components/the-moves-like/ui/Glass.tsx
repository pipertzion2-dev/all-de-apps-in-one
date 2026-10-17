"use client";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Clear colored glass — matches ZZAI feature-page glass (card/40 + blur + tint). */
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
      ? "bg-[hsl(197_45%_50%/0.14)] border-[hsl(197_45%_50%/0.35)]"
      : tint === "magenta"
        ? "bg-[hsl(315_60%_45%/0.16)] border-[hsl(315_70%_55%/0.35)]"
        : tint === "ink"
          ? "bg-[hsl(180_15%_8%/0.55)] border-white/10"
          : "bg-card/35 border-border/40";

  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.25)]",
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
        "min-h-10 shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] backdrop-blur-md transition",
        active
          ? "border-primary/50 bg-primary/25 text-primary-foreground sm:text-[#e8f4f8]"
          : "border-white/15 bg-white/10 text-white/85 hover:border-primary/40 hover:bg-primary/15",
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
          "min-h-11 backdrop-blur-md",
          variant === "outline" &&
            "border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white",
          variant === "secondary" && "bg-secondary/80 backdrop-blur-md",
          variant === "ghost" && "text-white hover:bg-white/10",
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
        "min-h-11 border-primary/40 bg-primary/90 text-primary-foreground shadow-[0_0_24px_rgba(91,141,168,0.25)] backdrop-blur-md",
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
        "min-h-11 border border-[hsl(315_70%_55%/0.45)] bg-[hsl(315_70%_42%/0.85)] text-white shadow-[0_0_28px_rgba(196,74,154,0.3)] backdrop-blur-md hover:brightness-110",
        className,
      )}
      {...props}
    />
  );
}

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
        "rounded-2xl border border-white/15 bg-[hsl(180_20%_6%/0.45)] p-3 shadow-[0_12px_48px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-4",
        "ring-1 ring-inset ring-[hsl(197_45%_50%/0.12)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
