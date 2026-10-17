"use client";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Clear translucent glass — blue #6D91B3 / purple #AC81AF.
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
      ? "border-[rgba(109,145,179,0.28)] bg-[rgba(109,145,179,0.12)] shadow-[0_8px_28px_rgba(109,145,179,0.08)]"
      : tint === "magenta"
        ? "border-[rgba(172,129,175,0.28)] bg-[rgba(172,129,175,0.12)] shadow-[0_8px_28px_rgba(172,129,175,0.08)]"
        : tint === "ink"
          ? "border-[rgba(15,26,28,0.1)] bg-[rgba(255,255,255,0.42)] shadow-[0_10px_32px_rgba(15,26,28,0.05)]"
          : "border-[rgba(15,26,28,0.08)] bg-[rgba(255,255,255,0.28)] shadow-[0_8px_28px_rgba(15,26,28,0.04)]";

  return (
    <div
      className={cn(
        "rounded-2xl border text-[hsl(180_20%_10%)] backdrop-blur-md [-webkit-backdrop-filter:blur(14px)]",
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
        "min-h-10 shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] backdrop-blur-md [-webkit-backdrop-filter:blur(10px)] transition",
        active
          ? "border-[rgba(109,145,179,0.4)] bg-[rgba(109,145,179,0.18)] text-[hsl(209_28%_28%)]"
          : "border-[rgba(15,26,28,0.12)] bg-[rgba(255,255,255,0.4)] text-[hsl(180_10%_38%)] hover:border-[rgba(109,145,179,0.35)] hover:bg-[rgba(109,145,179,0.1)] hover:text-[hsl(209_28%_28%)]",
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
          "min-h-11 backdrop-blur-md [-webkit-backdrop-filter:blur(10px)]",
          variant === "outline" &&
            "border-[rgba(15,26,28,0.14)] bg-[rgba(255,255,255,0.45)] text-[hsl(180_20%_12%)] hover:bg-[rgba(255,255,255,0.7)] hover:text-[hsl(180_20%_12%)]",
          variant === "secondary" && "bg-secondary/90",
          variant === "ghost" &&
            "text-[#6D91B3] hover:bg-[rgba(109,145,179,0.1)] hover:text-[hsl(209_28%_28%)]",
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
        "min-h-11 border border-[rgba(109,145,179,0.35)] bg-[#6D91B3] text-white shadow-[0_8px_24px_rgba(109,145,179,0.28)] hover:brightness-105",
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
        "min-h-11 border border-[rgba(172,129,175,0.4)] bg-[#AC81AF] text-white shadow-[0_8px_28px_rgba(172,129,175,0.3)] hover:brightness-105",
        className,
      )}
      {...props}
    />
  );
}

/** Frosted translucent dock — stage/camera still readable through it. */
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
        "rounded-2xl border border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.42)] p-3 text-[hsl(180_20%_10%)] shadow-[0_12px_32px_rgba(15,26,28,0.1)] backdrop-blur-lg [-webkit-backdrop-filter:blur(16px)] sm:p-4",
        "ring-1 ring-inset ring-[rgba(109,145,179,0.16)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
