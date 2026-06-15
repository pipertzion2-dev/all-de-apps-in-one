"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CLUTETY_COMING_SOON_PATH,
  CLUTETY_CORNER_LOGO_PATH,
  getClutetyPromoHref,
} from "@/lib/clutety/config";

const STORAGE_KEY = "svivva:clutetyCornerAd:dismissed:v4";
const LOGO_SRC = `${CLUTETY_CORNER_LOGO_PATH}?v=7`;

function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export function ClutetyCornerAd() {
  const [dismissed, setDismissed] = useState(true);
  const pathname = usePathname();
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
    if (!pathname) return false;
    if (pathname === "/") return false;
    if (pathname.startsWith("/dashboard/security")) return false;
    if (pathname.startsWith(CLUTETY_COMING_SOON_PATH)) return false;
    if (pathname.startsWith("/dashboard/orbit")) return false;
    if (pathname.startsWith("/dashboard/launchpad")) return false;
    if (pathname.startsWith("/seeds")) return false;
    return true;
  }, [dismissed, pathname]);

  if (!canShow) return null;

  const logo = (
    <img
      src={LOGO_SRC}
      alt="Clutety — coming soon"
      width={128}
      height={40}
      className="h-8 w-auto max-w-[128px] object-contain drop-shadow-md"
      style={{ display: "block" }}
      decoding="async"
    />
  );

  const linkClass =
    "group block rounded-lg bg-background/80 backdrop-blur-sm border border-border/40 p-1.5 shadow-lg hover:bg-background/95 transition-colors";

  return (
    <div
      className="fixed z-40 flex flex-col items-end gap-1 pointer-events-none"
      style={{
        right: "max(1rem, env(safe-area-inset-right))",
        top: "max(3.75rem, calc(3rem + env(safe-area-inset-top)))",
      }}
    >
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {}
          setDismissed(true);
        }}
        className="pointer-events-auto text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-background/70"
        aria-label="Dismiss Clutety promo"
      >
        ✕
      </button>
      {internal ? (
        <Link
          href={href}
          className={`${linkClass} pointer-events-auto`}
          aria-label="Clutety — coming soon"
        >
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
