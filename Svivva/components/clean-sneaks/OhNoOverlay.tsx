"use client";

import { OH_NO_ACTIONS, type OhNoAction } from "@/lib/clean-sneaks/contact-map";
import { OH_NO_WINDOW_MS } from "@/lib/clean-sneaks/run-engine";
import type { OhNoWindow } from "@/lib/clean-sneaks/types";
import type { CleanPathOption } from "@/lib/clean-sneaks/sneak-vision";

type OhNoProps = {
  window: OhNoWindow;
  onAction: (action: OhNoAction) => void;
};

/** Cinematic reaction window — time slows, choose a save. */
export function OhNoOverlay({ window, onAction }: OhNoProps) {
  if (!window.active || window.resolved) return null;
  const remaining = Math.max(0, window.endsAt - performance.now());
  const pct = Math.min(100, (remaining / OH_NO_WINDOW_MS) * 100);

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]"
      data-testid="oh-no-overlay"
    >
      <p className="text-xs uppercase tracking-[0.4em] text-[#ffcc66]">Oh No</p>
      <p className="mt-1 text-lg font-bold text-foreground">
        Protect the {window.shoe.toUpperCase()} shoe
      </p>
      <div className="mt-3 h-1 w-40 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full bg-[#ffcc66] transition-[width] duration-75"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2 px-4">
        {OH_NO_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onAction(a.id)}
            className="rounded border border-white/20 bg-black/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white hover:border-[#7EC8D9] hover:text-[#7EC8D9]"
            data-testid={`oh-no-${a.id}`}
          >
            <span className="mr-1.5 text-[#5B8DA8]">{a.key}</span>
            {a.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-white/50">Keys 1–6 · or tap</p>
    </div>
  );
}

type PathProps = {
  paths: CleanPathOption[];
};

export function CleanPathHud({ paths }: PathProps) {
  if (!paths.length) return null;
  return (
    <div
      className="pointer-events-none absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 gap-2"
      data-testid="clean-path-hud"
    >
      {paths.map((p) => (
        <div
          key={p.kind}
          className="min-w-[88px] rounded border border-white/15 bg-black/55 px-2.5 py-1.5 text-center backdrop-blur-sm"
        >
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#5B8DA8]">{p.label}</p>
          <p className="text-sm font-bold tabular-nums text-[#7EC8D9]">{p.predictedClean}%</p>
          <p className="text-[9px] text-white/45">Lane {p.lane + 1}</p>
        </div>
      ))}
    </div>
  );
}
