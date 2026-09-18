"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { preloadMainGameCover } from "@/components/clean-sneaks/GameStartScreen";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";

const GameLoadingWheels = dynamic(
  () => import("@/components/clean-sneaks/GameLoadingWheels").then((m) => m.GameLoadingWheels),
  { ssr: false },
);

const MIN_LOADING_MS = 2200;
const ENTER_GAME_KEY = "svivva:home-game-enter";

/** Third scroll panel — contained loading wheels, then hand off to full-screen game. */
export function HomepageGameLoadingPanel() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [fromCubeTap, setFromCubeTap] = useState(false);
  const launchedRef = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.5));
      },
      { threshold: [0, 0.5, 0.85] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    setFromCubeTap(sessionStorage.getItem(ENTER_GAME_KEY) === "1");

    let cancelled = false;
    const started = performance.now();

    void preloadMainGameCover().then(() => {
      const elapsed = performance.now() - started;
      const wait = Math.max(0, MIN_LOADING_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setReady(true);
      }, wait);
    });

    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!active || !ready || !fromCubeTap || launchedRef.current) return;
    launchedRef.current = true;
    sessionStorage.removeItem(ENTER_GAME_KEY);
    router.push("/clean-sneaks");
  }, [active, ready, fromCubeTap, router]);

  return (
    <section
      ref={sectionRef}
      id="home-game-loading"
      data-homepage-scroll-panel=""
      className="homepage-scroll-panel relative flex min-h-[100svh] flex-col overflow-hidden bg-white"
    >
      <HomepageScrollHint
        label="Scroll up · bundle cube"
        direction="up"
        onActivate={() => scrollToHomepagePanel("home-game")}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col pt-16 sm:pt-20">
        <GameLoadingWheels fullscreen={false} />
      </div>

      <div className="relative z-20 flex flex-col items-center gap-3 px-4 pb-16">
        {!fromCubeTap && (
          <p className="text-center text-xs text-neutral-500">
            Tap the bundle cube above to start, or press enter when ready.
          </p>
        )}
        {ready ? (
          <Button className="bg-[#5B8DA8]" onClick={() => router.push("/clean-sneaks")}>
            Enter game
          </Button>
        ) : (
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">Loading game…</p>
        )}
      </div>

      <HomepageScrollHint
        label="Scroll · explore"
        direction="down"
        onActivate={() => scrollToHomepagePanel("home-explore")}
      />
    </section>
  );
}
