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
    <div className="fixed inset-0 z-[80] overflow-hidden bg-black">
      {/* Denser / larger Three.js camo flowers behind the lock */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <CamoThreeOverlay preset="lock" isIntro eagerMount keepMounted className="h-full w-full" />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-4">
        <div className="mb-6 text-center sm:mb-8">
          <h1
            className="mb-3 text-4xl tracking-tight text-white sm:text-5xl md:text-6xl"
            style={{
              fontFamily: '"Zc", sans-serif',
              textShadow: "0 2px 14px rgba(0,0,0,0.55)",
            }}
          >
            pop the lock
          </h1>
          <p
            className="text-lg text-white/90 sm:text-xl md:text-2xl"
            style={{
              fontFamily: '"Zc", sans-serif',
              textShadow: "0 2px 10px rgba(0,0,0,0.45)",
            }}
          >
            Tap to enter
          </p>
        </div>

        <button
          ref={lockRef}
          type="button"
          onClick={handleClick}
          className="group relative cursor-pointer border-0 bg-transparent p-0 transition-transform duration-300 hover:scale-105 active:scale-95"
          aria-label="Pop the lock to enter"
          style={{
            width: "min(80vw, 500px)",
            height: "auto",
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out",
          }}
        >
          <Image
            src="/assets/lock-image.png"
            alt="Lock to enter site"
            width={1254}
            height={1254}
            priority
            className="h-auto w-full bg-transparent"
            style={{
              filter: "drop-shadow(0 16px 28px rgba(0,0,0,0.35))",
            }}
          />
        </button>
      </div>
    </div>
  );
}
