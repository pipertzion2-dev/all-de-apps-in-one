"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type PlatformMode = "digital" | "physical";

/** UI labels for the ZZAI crest/glitch duality (maps onto digital/physical product modes). */
export const PLATFORM_MODE_LABELS = {
  digital: {
    short: "Signal",
    long: "Signal — Prompt to API",
    subtitle: "Prompt to API",
  },
  physical: {
    short: "Crest",
    long: "Crest — Manufacturing",
    subtitle: "Manufacturing",
  },
} as const;

interface PlatformColors {
  primary: string;
  primaryHover: string;
  primaryBg: string;
  primaryBorder: string;
  accent: string;
}

/** Cyan / glitch — ZZAI orchid + signal side of the logo */
const digitalColors: PlatformColors = {
  primary: "#00E5FF",
  primaryHover: "#00C4DB",
  primaryBg: "rgba(0, 229, 255, 0.14)",
  primaryBorder: "rgba(0, 229, 255, 0.4)",
  accent: "#39FF14",
};

/** Magenta / ornate — ZZAI crest + matrix side of the logo */
const physicalColors: PlatformColors = {
  primary: "#FF2BD6",
  primaryHover: "#E016B8",
  primaryBg: "rgba(255, 43, 214, 0.14)",
  primaryBorder: "rgba(255, 43, 214, 0.4)",
  accent: "#C77DFF",
};

interface PlatformContextType {
  mode: PlatformMode;
  setMode: (mode: PlatformMode) => void;
  colors: PlatformColors;
  toggleMode: () => void;
  modeLabel: (typeof PLATFORM_MODE_LABELS)[PlatformMode];
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PlatformMode>("digital");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only restore saved mode if we're NOT on the home page (home page always starts digital/Signal)
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      const savedMode = localStorage.getItem("svivva-platform-mode") as PlatformMode | null;
      if (savedMode && (savedMode === "digital" || savedMode === "physical")) {
        setMode(savedMode);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("svivva-platform-mode", mode);
    document.documentElement.setAttribute("data-platform", mode);
    document.documentElement.setAttribute(
      "data-zzai-mode",
      mode === "digital" ? "signal" : "crest",
    );
  }, [mode]);

  const colors = mode === "digital" ? digitalColors : physicalColors;
  const modeLabel = PLATFORM_MODE_LABELS[mode];

  const toggleMode = () => {
    setMode(mode === "digital" ? "physical" : "digital");
  };

  return (
    <PlatformContext.Provider value={{ mode, setMode, colors, toggleMode, modeLabel }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
}
