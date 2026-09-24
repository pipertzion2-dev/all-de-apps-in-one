"use client";

import Link from "next/link";
import { listCubeSuiteMiniApps } from "@/lib/cube/mini-app-suite";

type CubeSuiteMiniAppsGridProps = {
  /** Show one-line “what it is” under each title */
  showBlurb?: boolean;
  className?: string;
};

/** Six cube faces as distinct mini apps — used on homepage pricing and billing. */
export function CubeSuiteMiniAppsGrid({
  showBlurb = true,
  className = "",
}: CubeSuiteMiniAppsGridProps) {
  const apps = listCubeSuiteMiniApps();

  return (
    <div
      className={`grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 ${className}`}
      aria-label="Cube suite mini apps"
    >
      {apps.map((app) => (
        <Link
          key={app.id}
          href={app.href}
          className="group flex flex-col gap-0.5 rounded-xl border border-border/50 bg-card/80 px-3 py-2.5 text-left backdrop-blur-sm transition-colors hover:border-[#5B8DA8]/50"
        >
          <span
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: app.accentColor }}
          >
            Mini app
          </span>
          <span className="text-sm font-medium text-foreground group-hover:text-[#5B8DA8]">
            {app.shortLabel}
          </span>
          <span className="text-[11px] leading-snug text-muted-foreground">{app.title}</span>
          {showBlurb ? (
            <span className="mt-0.5 text-[10px] leading-snug text-muted-foreground/90">
              {app.blurb}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
