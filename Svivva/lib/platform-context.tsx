"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type PlatformMode = "digital" | "physical";

interface PlatformColors {
  primary: string;
  primaryHover: string;
  primaryBg: string;
  primaryBorder: string;
  accent: string;
}

const digitalColors: PlatformColors = {
  primary: "#5BA8A0",
  primaryHover: "#4a9890",
  primaryBg: "rgba(91, 168, 160, 0.15)",
  primaryBorder: "rgba(91, 168, 160, 0.3)",
  accent: "#5BA8A0",
};

const physicalColors: PlatformColors = {
  primary: "#6B2C4A",
  primaryHover: "#5a2540",
  primaryBg: "rgba(107, 44, 74, 0.15)",
  primaryBorder: "rgba(107, 44, 74, 0.3)",
  accent: "#6B2C4A",
};

interface PlatformContextType {
  mode: PlatformMode;
  setMode: (mode: PlatformMode) => void;
  colors: PlatformColors;
  toggleMode: () => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PlatformMode>("digital");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only restore saved mode if we're NOT on the home page (home page always starts digital)
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
  }, [mode]);

  const colors = mode === "digital" ? digitalColors : physicalColors;

  const toggleMode = () => {
    setMode(mode === "digital" ? "physical" : "digital");
  };

  return (
    <PlatformContext.Provider value={{ mode, setMode, colors, toggleMode }}>
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
