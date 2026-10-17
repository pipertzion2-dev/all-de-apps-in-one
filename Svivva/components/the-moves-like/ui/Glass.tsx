"use client";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Clear colored glass — translucent so stage/camera show through,
 * tinted with ZZAI teal / magenta like the rest of the site.
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
      ? "border-[hsl(197_55%_60%/0.45)] bg-[hsl(197_45%_55%/0.18)] shadow-[0_8px_40px_rgba(91,141,168,0.22)]"
      : tint === "magenta"
        ? "border-[hsl(315_70%_65%/0.4)] bg-[hsl(315_55%_50%/0.18)] shadow-[0_8px_40px_rgba(196,74,154,0.22)]"
        : tint === "ink"
          ? "border-white/20 bg-[hsl(180_20%_10%/0.28)] shadow-[0_12px_48px_rgba(0,0,0,0.28)]"
          : "border-white/20 bg-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.2)]";

  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-2xl [-webkit-backdrop-filter:blur(24px)]",
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
        "min-h-10 shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] backdrop-blur-xl [-webkit-backdrop-filter:blur(16px)] transition",
        active
          ? "border-primary/55 bg-primary/35 text-white"
          : "border-white/20 bg-white/12 text-white/90 hover:border-primary/45 hover:bg-primary/20",
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
          "min-h-11 backdrop-blur-xl [-webkit-backdrop-filter:blur(16px)]",
          variant === "outline" &&
            "border-white/30 bg-white/12 text-white hover:bg-white/20 hover:text-white",
          variant === "secondary" && "bg-secondary/70 backdrop-blur-xl",
          variant === "ghost" && "text-white hover:bg-white/12",
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
        "min-h-11 border-primary/50 bg-primary/80 text-primary-foreground shadow-[0_0_28px_rgba(91,141,168,0.35)] backdrop-blur-xl [-webkit-backdrop-filter:blur(16px)]",
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
        "min-h-11 border border-[hsl(315_70%_60%/0.5)] bg-[hsl(315_65%_45%/0.72)] text-white shadow-[0_0_32px_rgba(196,74,154,0.4)] backdrop-blur-xl [-webkit-backdrop-filter:blur(16px)] hover:brightness-110",
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
        "rounded-2xl border border-white/20 bg-[hsl(197_30%_12%/0.28)] p-3 shadow-[0_16px_56px_rgba(0,0,0,0.3)] backdrop-blur-2xl [-webkit-backdrop-filter:blur(28px)] sm:p-4",
        "ring-1 ring-inset ring-[hsl(197_45%_55%/0.2)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
