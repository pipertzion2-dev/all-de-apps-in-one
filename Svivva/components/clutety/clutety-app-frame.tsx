"use client";

import { useState } from "react";
import { ArrowRight, Lock, Shield } from "lucide-react";
import { CLUTETY_EMBED_PATH, CLUTETY_TEAL } from "@/lib/clutety/config";

const TEAL = CLUTETY_TEAL;

type Props = {
  height?: number | string;
  title?: string;
};

/** Replit-builder live window: Pyracrypt Lock UI in an iframe. */
export function ClutetyAppFrame({
  height = 560,
  title = "Pyracrypt — File Protection Tool",
}: Props) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const src = CLUTETY_EMBED_PATH;

  const h = typeof height === "number" ? `${height}px` : height;

  return (
    <div className="relative" style={{ height: h }}>
      {!iframeError ? (
        <>
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-[#080c14]">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: `${TEAL}20`, border: `1px solid ${TEAL}40` }}
              >
                <Lock className="w-6 h-6" style={{ color: TEAL }} />
              </div>
              <p className="text-sm text-white/40">Loading Pyracrypt…</p>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: TEAL, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <iframe
            src={src}
            title={title}
            className="w-full h-full border-0 bg-[#EEF2F8]"
            style={{ opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.4s ease" }}
            onLoad={() => {
              setIframeLoaded(true);
              setIframeError(false);
            }}
            sandbox="allow-scripts allow-forms allow-same-origin allow-downloads"
          />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center bg-[#080c14]">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `${TEAL}15`, border: `1px solid ${TEAL}30` }}
          >
            <Shield className="w-8 h-8" style={{ color: TEAL }} />
          </div>
          <div>
            <p className="text-lg font-bold text-white mb-2">Pyracrypt</p>
            <p className="text-sm text-white/50 mb-6 max-w-sm">
              Encrypted file protection, right in your browser. No uploads. No accounts. Just
              shield.
            </p>
            <a
              href={src}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: TEAL }}
            >
              Open Pyracrypt <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
