"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PLATFORM_MODE_LABELS, platformModeFromPath, type PlatformMode } from "@/lib/platform-mode";

export type { PlatformMode } from "@/lib/platform-mode";
export {
  platformModeFromPath,
  platformModeForCubeFace,
  PLATFORM_MODE_LABELS,
} from "@/lib/platform-mode";

interface PlatformColors {
  primary: string;
  primaryHover: string;
  primaryBg: string;
  primaryBorder: string;
  accent: string;
}

/** Cyan / glitch — ZZAI orchid + signal side of the logo */
const digitalColors: PlatformColors = {
  primary: "#5B8DA8",
  primaryHover: "#4A7D98",
  primaryBg: "rgba(91, 141, 168, 0.15)",
  primaryBorder: "rgba(91, 141, 168, 0.35)",
  accent: "#C5D86A",
};

/** Magenta / ornate — ZZAI crest + matrix side of the logo */
const physicalColors: PlatformColors = {
  primary: "#D94F9C",
  primaryHover: "#C04488",
  primaryBg: "rgba(217, 79, 156, 0.15)",
  primaryBorder: "rgba(217, 79, 156, 0.35)",
  accent: "#7EC8D9",
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
  const pathname = usePathname() || "";
  const [mode, setMode] = useState<PlatformMode>("digital");

  useEffect(() => {
    const busMode = platformModeFromPath(pathname);
    if (busMode) {
      setMode(busMode);
      return;
    }
    // Only restore saved mode if we're NOT on the home page (home page always starts digital/Signal)
    if (pathname !== "/") {
      const savedMode = localStorage.getItem("svivva-platform-mode") as PlatformMode | null;
      if (savedMode === "digital" || savedMode === "physical") {
        setMode(savedMode);
      }
    }
  }, [pathname]);

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
