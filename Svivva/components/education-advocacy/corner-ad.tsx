"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";

const STORAGE_KEY = "svivva:eduAdvocacyCornerAd:dismissed:v1";
const HREF = "/dashboard/education-advocacy";
const CRISIS_HREF = "/dashboard/education-advocacy/crisis";

/**
 * Site-wide transparent corner promo for Education Advocacy.
 * Soft outreach for people harmed in academics by a parent or faculty —
 * not legal advice; links into the Advocate bus console.
 */
export function EducationAdvocacyCornerAd() {
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const canShow = useMemo(() => {
    if (!mounted || dismissed) return false;
    if (!pathname) return false;
    if (pathname.startsWith("/dashboard/education-advocacy")) return false;
    if (pathname.startsWith("/education/verify")) return false;
    if (pathname.startsWith("/protect/verify")) return false;
    return true;
  }, [dismissed, mounted, pathname]);

  if (!canShow) return null;

  return (
    <div
      className="fixed z-[85] pointer-events-none max-w-[min(15rem,calc(100vw-0.75rem))] sm:max-w-[min(18.5rem,calc(100vw-2rem))]"
      style={{
        right: "max(0.5rem, env(safe-area-inset-right))",
        bottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
      data-testid="edu-advocacy-corner-ad"
    >
      <aside
        className="pointer-events-auto relative rounded-lg sm:rounded-xl border border-white/10 bg-background/12 sm:bg-background/22 backdrop-blur-sm sm:backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.12)] sm:shadow-[0_8px_32px_rgba(0,0,0,0.18)] p-2.5 sm:p-3.5 space-y-2"
        aria-label="Education Advocacy advertisement"
      >
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
          className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10 text-[10px] leading-none text-muted-foreground/70 hover:text-foreground/90 px-1 py-0.5 rounded bg-background/15 backdrop-blur-sm border border-white/5"
          aria-label="Dismiss Education Advocacy notice"
        >
          ✕
        </button>

        <div className="flex items-start gap-2 pr-4 sm:pr-5">
          <span className="mt-0.5 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#5B8DA8]/12 sm:bg-[#5B8DA8]/20 border border-[#5B8DA8]/20 sm:border-[#5B8DA8]/30">
            <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#5B8DA8]/80" aria-hidden />
          </span>
          <div className="min-w-0 space-y-0.5 sm:space-y-1">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.14em] text-[#5B8DA8]/75 sm:text-[#5B8DA8]/90">
              Education Advocacy
            </p>
            <p className="text-xs sm:text-sm font-medium leading-snug text-foreground/80 sm:text-foreground/95">
              Need education advocacy help?
            </p>
            <p className="hidden sm:block text-xs leading-relaxed text-muted-foreground/90">
              Whether this happened to you or you’re helping someone else, get calm AI-guided tools
              to understand options, rebuild a timeline, and find verified human help.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5">
          <Link
            href={HREF}
            className="inline-flex items-center justify-center rounded-md px-2 sm:px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium text-white/95 bg-[#5B8DA8]/65 sm:bg-[#5B8DA8]/85 hover:bg-[#5B8DA8]/80 sm:hover:bg-[#5B8DA8] transition-colors"
          >
            Open advocacy console
          </Link>
          <Link
            href={CRISIS_HREF}
            className="inline-flex items-center justify-center rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-[11px] text-muted-foreground/75 sm:text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            I Need Help Now
          </Link>
        </div>
        <p className="hidden sm:block text-[10px] leading-snug text-muted-foreground/70">
          Not a lawyer, counselor, or emergency service — resource navigation and documentation
          support.
        </p>
      </aside>
    </div>
  );
}
