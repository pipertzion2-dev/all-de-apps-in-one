"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CLUTETY_TEAL } from "@/lib/clutety/config";

const STORAGE_KEY = "svivva:clutetyCornerAd:dismissed:v1";

type Props = {
  href?: string;
};

export function ClutetyCornerAd({ href = "/clutety?skip" }: Props) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const canShow = useMemo(() => {
    if (dismissed) return false;
    if (typeof window === "undefined") return false;
    const p = window.location.pathname || "";
    // Don't advertise on the Clutety pages themselves.
    if (p.startsWith("/clutety")) return false;
    return true;
  }, [dismissed]);

  if (!canShow) return null;

  return (
    <div className="fixed right-4 bottom-4 z-[60] w-[min(320px,calc(100vw-2rem))]">
      <div
        className="rounded-2xl border bg-background/35 backdrop-blur-xl shadow-lg overflow-hidden"
        style={{
          borderColor: "rgba(255,255,255,0.10)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div className="p-3">
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 rounded-xl border p-2"
              style={{
                borderColor: "rgba(255,255,255,0.10)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.10))",
              }}
            >
              <Image src="/clutety-logo.png" alt="Clutety" width={28} height={28} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-foreground/90 truncate">
                    Clutety
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-[2px]"
                    style={{ borderColor: `${CLUTETY_TEAL}55`, color: `${CLUTETY_TEAL}` }}
                  >
                    Feed Shield
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem(STORAGE_KEY, "1");
                    } catch {}
                    setDismissed(true);
                  }}
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-foreground/55 hover:text-foreground/80 transition"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>

              <p className="mt-1 text-xs leading-relaxed text-foreground/60">
                Transparent, local-only feed blocking — tuned for YouTube and beyond.
              </p>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Button asChild size="sm" className="h-8 px-3 text-xs">
                  <Link href={href}>Open</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs text-foreground/60 hover:text-foreground/80"
                  onClick={() => {
                    try {
                      localStorage.setItem(STORAGE_KEY, "1");
                    } catch {}
                    setDismissed(true);
                  }}
                >
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${CLUTETY_TEAL}AA, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

