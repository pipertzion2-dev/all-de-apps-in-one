"use client";

import {
  ALL_COLORWAY_IDS,
  BALOON8_COLORWAYS,
  type Baloon8ColorwayId,
} from "@/lib/clean-sneaks/sneaker-catalog";

type Props = {
  value: Baloon8ColorwayId;
  onChange: (id: Baloon8ColorwayId) => void;
  compact?: boolean;
};

/** BALOON8 only — pick a colorway of the same car-sneaker. */
export function Baloon8ColorwayPicker({ value, onChange, compact }: Props) {
  return (
    <div
      className={compact ? "space-y-1.5" : "space-y-2"}
      data-testid="baloon8-colorway-picker"
      role="listbox"
      aria-label="BALOON8 colorway"
    >
      <p
        className={`uppercase tracking-[0.25em] text-[#5B8DA8]/90 ${compact ? "text-[9px]" : "text-[10px]"}`}
      >
        BALOON8 · Colorway only
      </p>
      <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
        {ALL_COLORWAY_IDS.map((id) => {
          const cw = BALOON8_COLORWAYS[id];
          const selected = id === value;
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={selected}
              title={cw.label}
              onClick={() => onChange(id)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-left transition ${
                selected
                  ? "border-[#7EC8D9] bg-white/10 text-white"
                  : "border-white/15 bg-black/40 text-white/70 hover:border-white/35"
              }`}
              data-testid={`colorway-${id}`}
            >
              <span
                className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-white/25"
                style={{ background: cw.swatch }}
                aria-hidden
              />
              <span className={`font-medium ${compact ? "text-[10px]" : "text-xs"}`}>
                {cw.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
      <p className={`text-white/45 ${compact ? "text-[10px]" : "text-xs"}`}>
        {BALOON8_COLORWAYS[value].blurb}
      </p>
    </div>
  );
}
