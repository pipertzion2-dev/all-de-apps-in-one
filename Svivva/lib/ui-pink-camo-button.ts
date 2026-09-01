import type { CSSProperties } from "react";

/** Pink woodland-camo — layered radial blobs over a rose base. */
export const PINK_CAMO_BUTTON_STYLE: CSSProperties = {
  backgroundColor: "#ffb6c1",
  backgroundImage: [
    "radial-gradient(ellipse 48% 38% at 12% 22%, #ff69b4 0%, transparent 72%)",
    "radial-gradient(ellipse 42% 34% at 78% 18%, #db7093 0%, transparent 68%)",
    "radial-gradient(ellipse 52% 42% at 88% 78%, #c71585 0%, transparent 70%)",
    "radial-gradient(ellipse 38% 46% at 22% 82%, #ffc0cb 0%, transparent 66%)",
    "radial-gradient(ellipse 44% 36% at 52% 58%, #8b2252 0%, transparent 62%)",
    "radial-gradient(ellipse 36% 30% at 38% 12%, #ff1493 0%, transparent 58%)",
    "radial-gradient(ellipse 40% 40% at 65% 35%, #f472b6 0%, transparent 55%)",
    "linear-gradient(145deg, #ffb6c1 0%, #ff69b4 45%, #db7093 100%)",
  ].join(", "),
  backgroundSize: "100% 100%",
  boxShadow:
    "0 4px 18px rgba(199, 21, 85, 0.42), 0 1px 0 rgba(255, 255, 255, 0.38) inset, 0 -1px 0 rgba(139, 34, 82, 0.25) inset",
  color: "#fff",
  textShadow: "0 1px 3px rgba(80, 0, 40, 0.55), 0 0 12px rgba(255, 105, 180, 0.25)",
  border: "2px solid rgba(255, 192, 203, 0.55)",
};

/** Slightly muted pink camo while a long run is in progress. */
export const PINK_CAMO_BUTTON_ACTIVE_STYLE: CSSProperties = {
  ...PINK_CAMO_BUTTON_STYLE,
  filter: "brightness(0.92) saturate(1.08)",
  boxShadow:
    "0 2px 12px rgba(199, 21, 85, 0.5), 0 0 24px rgba(255, 105, 180, 0.35), 0 1px 0 rgba(255, 255, 255, 0.3) inset",
};

export const PINK_CAMO_BUTTON_CLASS =
  "font-black transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-70";

/** Label for the all-in-one Orbit run control. */
export const URRTHANG_LABEL = "urrthang";
