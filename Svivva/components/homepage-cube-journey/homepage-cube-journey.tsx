"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";
import { ClientErrorBoundary } from "@/components/client-error-boundary";
import { Button } from "@/components/ui/button";
import {
  hashForJourneyFace,
  JOURNEY_FACE_ORDER,
  nextJourneyFace,
  prevJourneyFace,
  type HomepageJourneyFace,
} from "@/lib/homepage-cube-journey";
import { HomepageGamePanel } from "@/components/homepage-game-panel";
import { HomepageExplorePanel } from "@/components/homepage-explore-panel";

const JourneyCubeCanvas = dynamic(
  () => import("./journey-cube-canvas").then((m) => m.JourneyCubeCanvas),
  { ssr: false },
);

const SvivvaArtifact = dynamic(
  () => import("@/components/svivva-artifact").then((m) => m.SvivvaArtifact),
  { ssr: false },
);

type HomepageCubeJourneyProps = {
  mountCanvas?: boolean;
  interactive?: boolean;
  initialFace?: HomepageJourneyFace;
  exploreFooter?: React.ReactNode;
};

function FaceTab({
  face,
  active,
  onSelect,
}: {
  face: HomepageJourneyFace;
  active: boolean;
  onSelect: (face: HomepageJourneyFace) => void;
}) {
  const labels: Record<HomepageJourneyFace, string> = {
    begin: "Begin",
    game: "Game",
    home: "Home",
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(face)}
      className={`rounded-full px-3 py-1 text-[11px] font-medium tracking-wide transition-colors ${
        active
          ? "bg-[#5B8DA8] text-white shadow-sm"
          : "bg-background/80 text-muted-foreground ring-1 ring-border/50 hover:text-foreground"
      }`}
      aria-current={active ? "true" : undefined}
    >
      {labels[face]}
    </button>
  );
}

/** Homepage macro navigation — one 3-face cube slides between begin, game, and home. */
export function HomepageCubeJourney({
  mountCanvas = true,
  interactive = true,
  initialFace = "begin",
  exploreFooter,
}: HomepageCubeJourneyProps) {
  const router = useRouter();
  const [face, setFace] = useState<HomepageJourneyFace>(initialFace);
  const [visitedGame, setVisitedGame] = useState(initialFace !== "begin");

  useEffect(() => {
    setFace(initialFace);
    if (initialFace !== "begin") setVisitedGame(true);
  }, [initialFace]);

  const goToFace = useCallback((next: HomepageJourneyFace) => {
    setFace(next);
    if (next !== "begin") setVisitedGame(true);
    const hash = hashForJourneyFace(next);
    window.history.replaceState(null, "", `/#${hash}`);
  }, []);

  useEffect(() => {
    if (!interactive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToFace(nextJourneyFace(face));
      if (e.key === "ArrowLeft") goToFace(prevJourneyFace(face));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [face, goToFace, interactive]);

  useEffect(() => {
    const onJourney = (event: Event) => {
      const detail = (event as CustomEvent<{ face?: HomepageJourneyFace }>).detail;
      if (detail?.face) goToFace(detail.face);
    };
    window.addEventListener("svivva:homepage-journey", onJourney);
    return () => window.removeEventListener("svivva:homepage-journey", onJourney);
  }, [goToFace]);

  const preferCornerOnBegin = face === "begin" && !visitedGame;

  return (
    <div
      id="homepage-cube-journey"
      className="relative w-full min-h-[100svh] overflow-x-hidden bg-background"
      style={{ pointerEvents: interactive ? "auto" : "none" }}
    >
      {face === "begin" ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 z-0" aria-hidden>
          <div className="sticky top-0 h-[100svh] w-full overflow-hidden opacity-80 md:opacity-65">
            <CamoThreeOverlay preset="oaas" eagerMount keepMounted className="h-full w-full" />
          </div>
        </div>
      ) : null}

      <div className="sticky top-20 sm:top-24 z-30 px-4 pt-2">
        <div
          className="relative mx-auto w-full max-w-[min(520px,92vw)]"
          style={{ height: "min(38vh, 360px)" }}
        >
          {mountCanvas ? (
            <JourneyCubeCanvas
              activeFace={face}
              preferCornerOnBegin={preferCornerOnBegin}
              mount={mountCanvas}
              onFaceSelect={goToFace}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs tracking-widest text-muted-foreground">
              loading cube…
            </div>
          )}
        </div>

        <div className="mx-auto mt-3 flex max-w-md flex-wrap items-center justify-center gap-2">
          {JOURNEY_FACE_ORDER.map((f) => (
            <FaceTab key={f} face={f} active={face === f} onSelect={goToFace} />
          ))}
        </div>

        <p className="mx-auto mt-2 max-w-md text-center text-[11px] tracking-wide text-muted-foreground">
          Drag the cube · tap a face · or use the tabs
        </p>
      </div>

      <div className="relative z-10 transition-opacity duration-500">
        {face === "begin" ? (
          <section id="nav-cube" data-homepage-journey-face="begin">
            <ClientErrorBoundary
              fallback={
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Cube navigation is temporarily unavailable.
                </p>
              }
            >
              <SvivvaArtifact mountCanvas={mountCanvas} />
            </ClientErrorBoundary>
            <div className="flex justify-center pb-8">
              <Button
                className="bg-[#5B8DA8]"
                onClick={() => goToFace("game")}
                data-testid="journey-next-game"
              >
                Rotate to game →
              </Button>
            </div>
          </section>
        ) : null}

        {face === "game" ? (
          <section id="home-game" data-homepage-journey-face="game">
            <HomepageGamePanel
              journeyMode
              onBack={() => goToFace("begin")}
              onNext={() => goToFace("home")}
              onEnterGame={() => router.push("/clean-sneaks")}
            />
          </section>
        ) : null}

        {face === "home" ? (
          <section id="home-explore" data-homepage-journey-face="home">
            <HomepageExplorePanel
              mountBackground={mountCanvas}
              journeyMode
              onBack={() => goToFace("game")}
              onBegin={() => goToFace("begin")}
            >
              {exploreFooter}
            </HomepageExplorePanel>
          </section>
        ) : null}
      </div>
    </div>
  );
}
