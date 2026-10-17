"use client";

import { GlassButton, GlassMagentaButton, GlassPanel } from "@/components/the-moves-like/ui/Glass";
import { cn } from "@/lib/utils";

/** Thin wrappers so screens keep Tml* names while using glossy glass chrome. */

export function TmlPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassPanel tint="clear" padding={false} className={className}>
      {children}
    </GlassPanel>
  );
}

export function TmlButton({
  className,
  variant = "primary",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  if (variant === "danger") {
    return (
      <button
        className={cn(
          "inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-red-300/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.45)_0%,rgba(248,113,113,0.18)_100%)] px-4 text-sm font-semibold tracking-wide text-red-700 backdrop-blur-[10px] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-40",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <GlassButton variant="ghost" className={cn("rounded-2xl", className)} {...props}>
        {children}
      </GlassButton>
    );
  }

  if (variant === "secondary") {
    return (
      <GlassButton variant="outline" className={cn("rounded-2xl", className)} {...props}>
        {children}
      </GlassButton>
    );
  }

  return (
    <GlassButton className={cn("rounded-2xl", className)} {...props}>
      {children}
    </GlassButton>
  );
}

export function TmlMagentaButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <GlassMagentaButton className={cn("rounded-2xl", className)} {...props}>
      {children}
    </GlassMagentaButton>
  );
}

export function TmlInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-10 w-full rounded-xl border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.22)_100%)] px-3 text-sm text-[hsl(180_20%_12%)] outline-none placeholder:text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md focus:border-[rgba(109,145,179,0.55)]",
        className,
      )}
      {...props}
    />
  );
}

export function TmlTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.22)_100%)] px-3 py-2 text-sm text-[hsl(180_20%_12%)] outline-none placeholder:text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md focus:border-[rgba(109,145,179,0.55)]",
        className,
      )}
      {...props}
    />
  );
}

export function TmlSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-10 w-full rounded-xl border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.22)_100%)] px-3 text-sm text-[hsl(180_20%_12%)] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md focus:border-[rgba(109,145,179,0.55)]",
        className,
      )}
      {...props}
    />
  );
}

export function TmlLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </label>
  );
}
