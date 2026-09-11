"use client";

import Link from "next/link";
import { Check, Download, FileArchive, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { encodeVisitedFacesParam } from "@/lib/cube/cube-face-progress";
import { FEATURES } from "./feature-defs";
import { useCubeFaceProgress } from "@/hooks/use-cube-face-progress";

export function CubeDownloadPanel() {
  const { visitedSet, isComplete, visitedCount, totalFaces } = useCubeFaceProgress();

  const zipHref = isComplete
    ? `/api/cube/walkthrough-pack?format=zip&visited=${encodeURIComponent(encodeVisitedFacesParam(visitedSet))}`
    : undefined;

  return (
    <div
      className="mt-6 w-full max-w-xl relative z-20 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-3"
      data-testid="cube-download-panel"
    >
      <div className="flex items-start gap-3">
        {isComplete ? (
          <FileArchive className="w-5 h-5 text-[#5B8DA8] shrink-0 mt-0.5" />
        ) : (
          <Lock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        )}
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-semibold">
            {isComplete ? "Download the six-face pack" : "Unlock the six-face pack"}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isComplete
              ? "ZIP with README, JSON, markdown walkthrough, CSV checklist, route map, and one file per cube face — your visited faces are marked done in the checklist."
              : "Open every cube face once — by tapping the 3D cube or the buttons below — to unlock the offline walkthrough pack."}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span data-testid="cube-visit-progress">
            {visitedCount} / {totalFaces} faces
          </span>
        </div>
        <div
          className="h-1.5 rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={visitedCount}
          aria-valuemin={0}
          aria-valuemax={totalFaces}
        >
          <div
            className="h-full bg-[#5B8DA8] transition-all duration-300"
            style={{ width: `${(visitedCount / totalFaces) * 100}%` }}
          />
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
          {FEATURES.map((f) => {
            const done = visitedSet.has(f.id);
            return (
              <li
                key={f.id}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                data-testid={`cube-face-progress-${f.id}`}
                data-visited={done ? "true" : "false"}
              >
                <span
                  className={`inline-flex w-4 h-4 items-center justify-center rounded-full border ${
                    done ? "border-[#5B8DA8] bg-[#5B8DA8]/15 text-[#5B8DA8]" : "border-border"
                  }`}
                >
                  {done ? <Check className="w-2.5 h-2.5" /> : null}
                </span>
                <span className={done ? "text-foreground" : undefined}>{f.shortLabel}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {isComplete && zipHref ? (
          <a href={zipHref} download>
            <Button
              size="sm"
              className="gap-2 bg-[#5B8DA8]"
              data-testid="button-cube-download-pack"
            >
              <Download className="w-3.5 h-3.5" />
              Download pack
            </Button>
          </a>
        ) : (
          <Button size="sm" className="gap-2" disabled data-testid="button-cube-download-pack">
            <Lock className="w-3.5 h-3.5" />
            Download pack
          </Button>
        )}
        <Link href="/tools/cube-walkthrough-pack">
          <Button size="sm" variant="outline" className="gap-2">
            Customize product name
          </Button>
        </Link>
      </div>
    </div>
  );
}
