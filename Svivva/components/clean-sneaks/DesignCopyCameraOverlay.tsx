"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  active: boolean;
  /** Smaller layout on portrait phones. */
  compact?: boolean;
  /** Bumps when a 3D copycam on the strip fires — syncs HUD flash with in-world photographers. */
  flashTrigger?: number;
};

/**
 * Paparazzi-style camera framing the kicks — someone trying to snap the design to copy it.
 */
export function DesignCopyCameraOverlay({ active, compact, flashTrigger = 0 }: Props) {
  const [screenFlash, setScreenFlash] = useState(0);
  const [shutter, setShutter] = useState(false);
  const [onCamFlash, setOnCamFlash] = useState(false);
  const [flashLabel, setFlashLabel] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const fireFlashAttempt = useCallback(
    (opts?: { double?: boolean; label?: string }) => {
      clearTimers();
      setFlashLabel(opts?.label ?? "SNAP!");
      setShutter(true);
      setOnCamFlash(true);

      const pushTimer = (fn: () => void, ms: number) => {
        timersRef.current.push(window.setTimeout(fn, ms));
      };

      pushTimer(() => setScreenFlash(1), 40);
      pushTimer(() => setScreenFlash(0.35), 120);
      pushTimer(() => {
        setScreenFlash(0);
        setOnCamFlash(false);
        setShutter(false);
        setFlashLabel(null);
      }, 260);

      if (opts?.double) {
        pushTimer(() => {
          setOnCamFlash(true);
          setScreenFlash(0.85);
        }, 380);
        pushTimer(() => setScreenFlash(0), 520);
        pushTimer(() => setOnCamFlash(false), 540);
      }
    },
    [clearTimers],
  );

  useEffect(() => {
    if (!active) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const tick = () => {
      const doubleTry = Math.random() < 0.38;
      fireFlashAttempt({ double: doubleTry, label: doubleTry ? "COPY!" : "SNAP!" });
    };

    tick();
    const id = window.setInterval(tick, compact ? 3600 : 2800);
    return () => {
      window.clearInterval(id);
      clearTimers();
    };
  }, [active, compact, clearTimers, fireFlashAttempt]);

  useEffect(() => {
    if (!active || flashTrigger <= 0) return;
    fireFlashAttempt({ double: Math.random() < 0.55, label: "FLASH!" });
  }, [active, flashTrigger, fireFlashAttempt]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  if (!active) return null;

  const screenOpacity = screenFlash >= 1 ? 0.58 : screenFlash > 0 ? 0.22 + screenFlash * 0.35 : 0;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[8] overflow-hidden"
      data-testid="design-copy-camera-overlay"
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-white transition-opacity duration-75"
        style={{ opacity: screenOpacity }}
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.55),transparent_55%)] transition-opacity duration-100"
        style={{ opacity: onCamFlash ? 1 : 0 }}
      />

      <div
        className={`absolute left-[6%] top-[18%] flex flex-col items-start gap-1 sm:left-[8%] sm:top-[16%] ${
          compact ? "scale-[0.82] origin-top-left" : ""
        }`}
        style={{
          animation: "kleanCamPeek 3.4s ease-in-out infinite",
        }}
      >
        <div
          className={`relative transition-transform duration-100 ${shutter ? "scale-[0.94]" : "scale-100"}`}
        >
          <svg
            width="88"
            height="72"
            viewBox="0 0 88 72"
            className="drop-shadow-[0_4px_18px_rgba(0,0,0,0.65)]"
          >
            <rect
              x="8"
              y="22"
              width="52"
              height="36"
              rx="6"
              fill="#1a1a1f"
              stroke="#e8e8ec"
              strokeWidth="1.2"
            />
            <circle cx="34" cy="40" r="14" fill="#0d0d12" stroke="#c4c4cc" strokeWidth="2" />
            <circle cx="34" cy="40" r="9" fill="#2a3040" />
            <circle cx="31" cy="37" r="2.5" fill="#ffffff" opacity="0.35" />
            <rect x="52" y="28" width="14" height="10" rx="2" fill="#2d2d35" />
            <rect x="0" y="34" width="18" height="8" rx="2" fill="#33333c" />
            <rect
              x="58"
              y="16"
              width="16"
              height="12"
              rx="2"
              fill="#fffef5"
              opacity={onCamFlash ? 1 : 0.15}
              style={{
                filter: onCamFlash ? "drop-shadow(0 0 8px rgba(255,255,255,0.95))" : undefined,
              }}
            />
          </svg>
          <span
            className={`absolute -right-1 top-1 h-2 w-2 rounded-full bg-[#ff4d4d] ${
              shutter || onCamFlash ? "opacity-100" : "opacity-70"
            }`}
            style={{ animation: "kleanRecPulse 1.1s ease-in-out infinite" }}
          />
          {flashLabel && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.2em] text-[#ffd76a] drop-shadow-md">
              {flashLabel}
            </span>
          )}
        </div>
        <p className="max-w-[9rem] text-[9px] font-semibold uppercase leading-tight tracking-[0.18em] text-white/75 drop-shadow-md sm:text-[10px]">
          Copying the colorway…
        </p>
      </div>

      <div
        className={`absolute inset-x-[14%] bottom-[22%] top-[38%] border-2 border-white/55 sm:inset-x-[18%] sm:bottom-[24%] sm:top-[34%] ${
          compact ? "bottom-[26%] top-[40%]" : ""
        } ${shutter ? "border-white/90" : ""}`}
        style={{
          boxShadow: shutter
            ? "inset 0 0 24px rgba(255,255,255,0.35)"
            : "inset 0 0 0 1px rgba(255,255,255,0.15)",
          animation: "kleanViewfinderPulse 2.8s ease-in-out infinite",
        }}
      >
        <span className="absolute left-2 top-2 text-[9px] font-mono uppercase tracking-widest text-white/70">
          AF · LIVE
        </span>
        <span className="absolute bottom-2 right-2 text-[9px] font-mono text-[#ffd76a]/90">
          1/250
        </span>
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
      </div>

      <style jsx>{`
        @keyframes kleanCamPeek {
          0%,
          100% {
            transform: translate(0, 0) rotate(-6deg);
          }
          45% {
            transform: translate(6px, 4px) rotate(-2deg);
          }
          70% {
            transform: translate(2px, -2px) rotate(-8deg);
          }
        }
        @keyframes kleanViewfinderPulse {
          0%,
          100% {
            opacity: 0.72;
          }
          50% {
            opacity: 0.95;
          }
        }
        @keyframes kleanRecPulse {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
