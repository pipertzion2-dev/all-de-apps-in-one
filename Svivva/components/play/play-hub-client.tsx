"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";
import { cn } from "@/lib/utils";

const MovesLikeApp = dynamic(
  () => import("@/components/the-moves-like/MovesLikeApp").then((m) => m.MovesLikeApp),
  { ssr: false, loading: () => <PlaySectionLoading label={MOVES_LIKE.name} /> },
);

const PlayStudioClient = dynamic(
  () => import("@/components/play/play-studio-client"),
  {
    ssr: false,
    loading: () => <PlaySectionLoading label="Studio" />,
  },
);

export type PlayHubSection = "moves" | "studio";

function PlaySectionLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[50svh] items-center justify-center px-4 text-sm text-muted-foreground">
      Loading {label}…
    </div>
  );
}

function resolveSection(raw: string | null): PlayHubSection {
  return raw === "studio" ? "studio" : "moves";
}

/**
 * Play hosts The Moves Like by default; MIDI Studio stays as a second section.
 */
export function PlayHubClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [section, setSection] = useState<PlayHubSection>(() =>
    resolveSection(searchParams.get("section")),
  );

  useEffect(() => {
    setSection(resolveSection(searchParams.get("section")));
  }, [searchParams]);

  const selectSection = (next: PlayHubSection) => {
    setSection(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "moves") {
      params.delete("section");
    } else {
      params.set("section", "studio");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="min-h-svh bg-[#F7FBFC]" data-testid="play-hub">
      <header className="sticky top-0 z-40 border-b border-black/8 bg-[#F7FBFC]/92 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between gap-2 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <BrandMark size="sm" href="/" />
            <span className="truncate text-xs font-semibold tracking-wide text-[#0F1A1C] sm:text-sm">
              Play
            </span>
          </div>
          <div
            className="flex items-center rounded-full border border-black/10 bg-white/80 p-0.5 shadow-sm"
            role="tablist"
            aria-label="Play sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={section === "moves"}
              className={cn(
                "rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors sm:text-[11px]",
                section === "moves"
                  ? "bg-[#AC81AF] text-white"
                  : "text-[#0F1A1C]/65 hover:text-[#0F1A1C]",
              )}
              onClick={() => selectSection("moves")}
              data-testid="tab-play-moves"
            >
              {MOVES_LIKE.shortName}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={section === "studio"}
              className={cn(
                "rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors sm:text-[11px]",
                section === "studio"
                  ? "bg-[#5B8DA8] text-white"
                  : "text-[#0F1A1C]/65 hover:text-[#0F1A1C]",
              )}
              onClick={() => selectSection("studio")}
              data-testid="tab-play-studio"
            >
              Studio
            </button>
          </div>
          <Link href="/" className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-black/15 bg-white/70 px-2.5 text-[10px] text-[#0F1A1C]/75 sm:text-xs"
              data-testid="button-play-hub-home"
            >
              Home
            </Button>
          </Link>
        </div>
      </header>

      {section === "moves" ? (
        <div data-testid="play-section-moves">
          <MovesLikeApp />
        </div>
      ) : (
        <div data-testid="play-section-studio">
          <PlayStudioClient embeddedInHub />
        </div>
      )}
    </div>
  );
}
