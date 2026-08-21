"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";

const STORAGE_KEY = "svivva:eduAdvocacyCornerAd:dismissed:v1";
const INTRO_DONE_KEY = "svivva:homepageIntroComplete";
const HREF = "/dashboard/education-advocacy";
const CRISIS_HREF = "/dashboard/education-advocacy/crisis";

/**
 * Site-wide glass corner promo — lower-right on mobile, hidden during homepage intro flip.
 */
export function EducationAdvocacyCornerAd() {
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [homepageIntroDone, setHomepageIntroDone] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    const syncIntro = () => {
      try {
        setHomepageIntroDone(sessionStorage.getItem(INTRO_DONE_KEY) === "1");
      } catch {
        setHomepageIntroDone(false);
      }
    };
    syncIntro();
    window.addEventListener("svivva:homepage-intro-complete", syncIntro);
    return () => window.removeEventListener("svivva:homepage-intro-complete", syncIntro);
  }, []);

  const canShow = useMemo(() => {
    if (!mounted || dismissed) return false;
    if (!pathname) return false;
    if (pathname.startsWith("/dashboard/education-advocacy")) return false;
    if (pathname.startsWith("/education/verify")) return false;
    if (pathname.startsWith("/protect/verify")) return false;
    if (pathname === "/" && !homepageIntroDone) return false;
    return true;
  }, [dismissed, homepageIntroDone, mounted, pathname]);

  if (!canShow) return null;

  return (
    <aside
      className="fixed z-30 pointer-events-auto max-w-[min(13.5rem,calc(100vw-0.5rem))] sm:max-w-[min(17rem,calc(100vw-1.5rem))] rounded-xl border border-white/[0.07] bg-white/[0.04] dark:bg-black/[0.12] backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-2 sm:p-2.5 space-y-1.5 sm:space-y-2"
      style={{
        right: "max(0.375rem, env(safe-area-inset-right))",
        bottom: "max(0.375rem, env(safe-area-inset-bottom))",
      }}
      aria-label="Education Advocacy advertisement"
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
        className="absolute top-1 right-1 z-10 text-[10px] leading-none text-muted-foreground/60 hover:text-foreground/80 px-1 py-0.5 rounded-md bg-white/[0.04] backdrop-blur-sm border border-white/[0.06]"
        aria-label="Dismiss Education Advocacy notice"
      >
        ✕
      </button>

      <div className="flex items-start gap-1.5 sm:gap-2 pr-3.5">
        <span className="mt-0.5 flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-md bg-[#5B8DA8]/10 border border-[#5B8DA8]/15">
          <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#5B8DA8]/70" aria-hidden />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-[#5B8DA8]/65">
            Education Advocacy
          </p>
          <p className="text-[11px] sm:text-xs font-medium leading-snug text-foreground/70">
            Need education advocacy help?
          </p>
          <p className="hidden sm:block text-[11px] leading-relaxed text-muted-foreground/65">
            Calm AI-guided tools for options, timelines, and verified human help.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
        <Link
          href={HREF}
          className="inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] sm:text-[11px] font-medium text-white/90 bg-[#5B8DA8]/50 hover:bg-[#5B8DA8]/65 backdrop-blur-sm transition-colors"
        >
          Open console
        </Link>
        <Link
          href={CRISIS_HREF}
          className="inline-flex items-center justify-center rounded-md px-1.5 py-1 text-[9px] sm:text-[10px] text-muted-foreground/60 hover:text-foreground/80 underline-offset-2 hover:underline"
        >
          Help now
        </Link>
      </div>
    </aside>
  );
}
