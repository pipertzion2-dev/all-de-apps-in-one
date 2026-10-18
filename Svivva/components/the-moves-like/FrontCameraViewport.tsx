"use client";

import { forwardRef } from "react";

type Props = {
  /** Mirrored selfie preview (default true — matches iPhone front camera feel) */
  mirror?: boolean;
  className?: string;
  children?: React.ReactNode;
  /** Overlay chrome inside the frame (controls, PIP, etc.) */
  overlay?: React.ReactNode;
};

/**
 * Full-bleed portrait front-camera frame.
 * Video is mirrored for natural selfie framing; recording can still be unmirrored separately.
 * Empty state uses a light blue/purple wash so chrome stays frosted-white (not black).
 */
export const FrontCameraViewport = forwardRef<HTMLVideoElement, Props>(function FrontCameraViewport(
  { mirror = true, className = "", children, overlay },
  ref,
) {
  return (
    <div
      className={`relative overflow-hidden bg-[#eef2f6] ${className}`}
      style={{
        minHeight: "min(100dvh, 100svh)",
        backgroundImage:
          "radial-gradient(ellipse 70% 50% at 50% 35%, rgba(109,145,179,0.28), transparent 60%), radial-gradient(ellipse 55% 40% at 85% 15%, rgba(172,129,175,0.2), transparent 55%), linear-gradient(180deg, #ffffff 0%, #eef2f6 55%, #e4eaf0 100%)",
      }}
    >
      <video
        ref={ref}
        className={`absolute inset-0 h-full w-full object-cover ${mirror ? "scale-x-[-1]" : ""}`}
        playsInline
        muted
        autoPlay
      />
      {/* Soft edge wash — keeps frosted docks readable without going black */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/55 via-transparent to-white/25"
      />
      {overlay ? <div className="absolute inset-0 z-10">{overlay}</div> : null}
      {children}
    </div>
  );
});
