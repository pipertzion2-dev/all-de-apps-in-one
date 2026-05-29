"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CLUTETY_COMING_SOON_PATH,
  CLUTETY_LOGO_PATH,
  getClutetyPromoHref,
} from "@/lib/clutety/config";

const STORAGE_KEY = "svivva:clutetyCornerAd:dismissed:v2";

function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export function ClutetyCornerAd() {
  const [dismissed, setDismissed] = useState(true);
  const href = getClutetyPromoHref();
  const internal = isInternalHref(href);

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
    if (p.startsWith(CLUTETY_COMING_SOON_PATH)) return false;
    return true;
  }, [dismissed]);

  if (!canShow) return null;

  const logo = (
    // Native img keeps PNG alpha; Next/Image can matte transparent assets on some themes.
    <img
      src={CLUTETY_LOGO_PATH}
      alt="Clutety — coming soon"
      width={96}
      height={64}
      className="h-10 w-auto max-w-[96px] object-contain opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
      style={{ background: "transparent", display: "block" }}
      decoding="async"
    />
  );

  const linkClass =
    "group block p-0 m-0 border-0 bg-transparent shadow-none outline-none ring-0";

  return (
    <div className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-1 pointer-events-none">
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {}
          setDismissed(true);
        }}
        className="pointer-events-auto text-[10px] text-foreground/40 hover:text-foreground/70 px-1"
        aria-label="Dismiss Clutety promo"
      >
        ✕
      </button>
      {internal ? (
        <Link href={href} className={`${linkClass} pointer-events-auto`} aria-label="Clutety — coming soon">
          {logo}
        </Link>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkClass} pointer-events-auto`}
          aria-label="Clutety — coming soon"
        >
          {logo}
        </a>
      )}
    </div>
  );
}
