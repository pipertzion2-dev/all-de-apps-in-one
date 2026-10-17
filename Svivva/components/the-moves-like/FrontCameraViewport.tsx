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
 */
export const FrontCameraViewport = forwardRef<HTMLVideoElement, Props>(function FrontCameraViewport(
  { mirror = true, className = "", children, overlay },
  ref,
) {
  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      style={{
        // Fill usable phone viewport under chrome
        minHeight: "min(100dvh, 100svh)",
      }}
    >
      <video
        ref={ref}
        className={`absolute inset-0 h-full w-full object-cover ${mirror ? "scale-x-[-1]" : ""}`}
        playsInline
        muted
        autoPlay
      />
      {/* Soft vignette so controls stay readable on bright rooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35"
      />
      {overlay ? <div className="absolute inset-0 z-10">{overlay}</div> : null}
      {children}
    </div>
  );
});
