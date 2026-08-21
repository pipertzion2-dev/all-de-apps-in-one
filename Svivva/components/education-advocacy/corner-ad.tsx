"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";

const STORAGE_KEY = "svivva:eduAdvocacyCornerAd:dismissed:v1";
const INTRO_DONE_KEY = "svivva:homepageIntroComplete";
const HREF = "/dashboard/education-advocacy";
const CRISIS_HREF = "/dashboard/education-advocacy/crisis";

/** Crystal-glass panel styling — ultra-clear diamond facet look. */
const DIAMOND_GLASS = {
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 38%, rgba(255,255,255,0.08) 62%, rgba(255,255,255,0.02) 100%)",
  backdropFilter: "blur(28px) saturate(210%) brightness(1.08)",
  WebkitBackdropFilter: "blur(28px) saturate(210%) brightness(1.08)",
  boxShadow:
    "0 10px 40px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(255,255,255,0.08), inset 0 0 24px rgba(255,255,255,0.04)",
} as const;

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
      className="fixed z-30 pointer-events-auto max-w-[min(13.5rem,calc(100vw-0.5rem))] sm:max-w-[min(17rem,calc(100vw-1.5rem))] rounded-2xl p-px backdrop-blur-3xl"
      style={{
        right: "max(0.375rem, env(safe-area-inset-right))",
        bottom: "max(0.375rem, env(safe-area-inset-bottom))",
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.25) 100%)",
        boxShadow: "0 12px 36px rgba(15, 23, 42, 0.06)",
      }}
      aria-label="Education Advocacy advertisement"
      data-testid="edu-advocacy-corner-ad"
    >
      <div
        className="relative overflow-hidden rounded-[calc(1rem-1px)] p-2 sm:p-2.5 space-y-1.5 sm:space-y-2 backdrop-blur-3xl"
        style={DIAMOND_GLASS}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-white/5"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-6 -right-4 h-14 w-14 rounded-full bg-white/30 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-8 w-full bg-gradient-to-t from-white/10 to-transparent"
          aria-hidden
        />

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
          className="absolute top-1 right-1 z-10 text-[10px] leading-none text-muted-foreground/50 hover:text-foreground/75 px-1 py-0.5 rounded-md border border-white/20 bg-white/[0.06] backdrop-blur-md"
          aria-label="Dismiss Education Advocacy notice"
        >
          ✕
        </button>

        <div className="relative flex items-start gap-1.5 sm:gap-2 pr-3.5">
          <span className="mt-0.5 flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/[0.08] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
            <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#5B8DA8]/75" aria-hidden />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-[#5B8DA8]/70">
              Education Advocacy
            </p>
            <p className="text-[11px] sm:text-xs font-medium leading-snug text-foreground/65">
              Need education advocacy help?
            </p>
            <p className="hidden sm:block text-[11px] leading-relaxed text-muted-foreground/55">
              Calm AI-guided tools for options, timelines, and verified human help.
            </p>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-1 sm:gap-1.5">
          <Link
            href={HREF}
            className="inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] sm:text-[11px] font-medium text-white/95 bg-[#5B8DA8]/45 hover:bg-[#5B8DA8]/58 backdrop-blur-md border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors"
          >
            Open console
          </Link>
          <Link
            href={CRISIS_HREF}
            className="inline-flex items-center justify-center rounded-md px-1.5 py-1 text-[9px] sm:text-[10px] text-muted-foreground/55 hover:text-foreground/75 underline-offset-2 hover:underline"
          >
            Help now
          </Link>
        </div>
        <p className="relative hidden sm:block text-[9px] leading-snug text-muted-foreground/45">
          Not a lawyer or emergency service — resource navigation only.
        </p>
      </div>
    </aside>
  );
}
