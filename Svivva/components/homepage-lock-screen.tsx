"use client";

import { useRef } from "react";
import { CamoThreeOverlay } from "./camo-three-overlay";
import Image from "next/image";

interface HomepageLockScreenProps {
  onUnlock: () => void;
}

export function HomepageLockScreen({ onUnlock }: HomepageLockScreenProps) {
  const lockRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (lockRef.current) {
      lockRef.current.style.transform = "scale(1.1)";
      lockRef.current.style.opacity = "0";
      setTimeout(() => {
        onUnlock();
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-white">
      {/* Three.js camo flowers background with white bg */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <CamoThreeOverlay
          preset="hero"
          isIntro
          eagerMount
          keepMounted
          className="h-full w-full"
        />
      </div>

      {/* Lock image and text - clickable */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1
            className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              textShadow: "0 2px 10px rgba(255,255,255,0.8)",
            }}
          >
            pop the lock
          </h1>
          <p className="text-lg text-gray-700 sm:text-xl md:text-2xl">
            Tap to enter
          </p>
        </div>

        <button
          ref={lockRef}
          onClick={handleClick}
          className="group relative cursor-pointer border-0 bg-transparent p-0 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Pop the lock to enter"
          style={{
            width: "min(80vw, 500px)",
            height: "auto",
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out",
          }}
        >
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src="/assets/lock-image.jpg"
              alt="Lock to enter site"
              width={500}
              height={500}
              priority
              className="h-auto w-full"
              style={{
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))",
              }}
            />
            {/* Shimmer effect on hover */}
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                animation: "shimmer 2s infinite",
              }}
            />
          </div>

          {/* Pulsing glow */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 animate-pulse rounded-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
        </button>

        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
