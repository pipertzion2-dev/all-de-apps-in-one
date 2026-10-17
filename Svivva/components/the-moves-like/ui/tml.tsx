"use client";

import { cn } from "@/lib/utils";

export function TmlPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#2A2E38] bg-[#121419] shadow-[0_0_0_1px_rgba(198,255,0,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TmlButton({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold tracking-wide transition disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" &&
          "bg-[#C6FF00] text-[#08090B] hover:brightness-110 shadow-[0_0_24px_rgba(198,255,0,0.18)]",
        variant === "secondary" &&
          "border border-[#2A2E38] bg-[#1A1D24] text-white hover:border-[#3D8BFF]/50 hover:bg-[#1E2230]",
        variant === "ghost" && "text-[#8B919A] hover:bg-white/5 hover:text-white",
        variant === "danger" &&
          "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
        className,
      )}
      {...props}
    />
  );
}

export function TmlInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-10 w-full rounded-lg border border-[#2A2E38] bg-[#08090B] px-3 text-sm text-white outline-none placeholder:text-[#8B919A] focus:border-[#C6FF00]/50",
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
        "min-h-24 w-full rounded-lg border border-[#2A2E38] bg-[#08090B] px-3 py-2 text-sm text-white outline-none placeholder:text-[#8B919A] focus:border-[#C6FF00]/50",
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
        "min-h-10 w-full rounded-lg border border-[#2A2E38] bg-[#08090B] px-3 text-sm text-white outline-none focus:border-[#C6FF00]/50",
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
        "block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B919A]",
        className,
      )}
    >
      {children}
    </label>
  );
}
