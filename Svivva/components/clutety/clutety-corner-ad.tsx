"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "svivva:clutetyCornerAd:dismissed:v2";

/** External Clutety product URL (logo-only promo; not part of Svivva UI). */
function getClutetyExternalUrl(): string {
  if (typeof window !== "undefined") {
    const env = process.env.NEXT_PUBLIC_CLUTETY_EXTERNAL_URL?.trim();
    if (env) return env.replace(/\/$/, "");
  }
  return (
    process.env.NEXT_PUBLIC_CLUTETY_EXTERNAL_URL?.trim()?.replace(/\/$/, "") ||
    "https://clutety.svivva.com"
  );
}

export function ClutetyCornerAd() {
  const [dismissed, setDismissed] = useState(true);
  const href = getClutetyExternalUrl();

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
    if (p.startsWith("/dashboard/security")) return false;
    return true;
  }, [dismissed]);

  if (!canShow) return null;

  return (
    <div className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {}
          setDismissed(true);
        }}
        className="text-[10px] text-foreground/40 hover:text-foreground/70 px-1"
        aria-label="Dismiss"
      >
        ✕
      </button>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block bg-transparent p-0 shadow-none"
        aria-label="Clutety"
      >
        <Image
          src="/clutety-shell/pyracrypt-logo-nobg.png"
          alt="Clutety"
          width={44}
          height={44}
          className="opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
        />
      </Link>
    </div>
  );
}
