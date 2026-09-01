import type { CSSProperties } from "react";

/** Chrome metallic silver — matches artwork palette tertiary (#b8b8c8). */
export const CHROME_SILVER_BUTTON_STYLE: CSSProperties = {
  background:
    "linear-gradient(145deg, #fafafc 0%, #e4e4ec 18%, #b8b8c8 42%, #d8d8e2 62%, #a0a0ae 82%, #ececf4 100%)",
  boxShadow:
    "0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(48,48,58,0.22) inset, 0 2px 12px rgba(0,0,0,0.32)",
  color: "#1a1a22",
  border: "1px solid rgba(255,255,255,0.58)",
  textShadow: "0 1px 0 rgba(255,255,255,0.5)",
};

export const CHROME_SILVER_BUTTON_CLASS =
  "font-bold transition-all hover:brightness-105 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed";
