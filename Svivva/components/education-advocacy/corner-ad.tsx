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
      className="fixed z-40 flex flex-col items-end gap-1 pointer-events-none max-w-[min(18.5rem,calc(100vw-2rem))]"
      style={{
        right: "max(1rem, env(safe-area-inset-right))",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
      data-testid="edu-advocacy-corner-ad"
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
        className="pointer-events-auto text-[10px] text-muted-foreground/80 hover:text-foreground px-1.5 py-0.5 rounded-md bg-background/35 backdrop-blur-md border border-white/10"
        aria-label="Dismiss Education Advocacy notice"
      >
        ✕
      </button>

      <aside
        className="pointer-events-auto rounded-xl border border-white/15 bg-background/35 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.18)] p-3.5 space-y-2.5"
        aria-label="Education Advocacy advertisement"
      >
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#5B8DA8]/20 border border-[#5B8DA8]/30">
            <GraduationCap className="h-4 w-4 text-[#5B8DA8]" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#5B8DA8]/90">
              Education Advocacy
            </p>
            <p className="text-sm font-medium leading-snug text-foreground/95">
              Need education advocacy help?
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Whether this happened to you or you’re helping someone else, get calm AI-guided tools
              to understand options, rebuild a timeline, and find verified human help.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Link
            href={HREF}
            className="inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium text-white bg-[#5B8DA8]/85 hover:bg-[#5B8DA8] transition-colors"
          >
            Open advocacy console
          </Link>
          <Link
            href={CRISIS_HREF}
            className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            I Need Help Now
          </Link>
        </div>
        <p className="text-[10px] leading-snug text-muted-foreground/80">
          Not a lawyer, counselor, or emergency service — resource navigation and documentation
          support.
        </p>
      </aside>
    </div>
  );
}
