"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDeviceGyro, type UseDeviceGyroResult } from "@/lib/the-moves-like/use-device-gyro";

const GyroContext = createContext<UseDeviceGyroResult | null>(null);

/** One shared gyro session for THE MOVES LIKE — auto-starts when the OS allows. */
export function GyroProvider({ children }: { children: ReactNode }) {
  const gyro = useDeviceGyro({ autoStart: true });
  return <GyroContext.Provider value={gyro}>{children}</GyroContext.Provider>;
}

export function useMovesLikeGyro(): UseDeviceGyroResult {
  const ctx = useContext(GyroContext);
  if (!ctx) {
    throw new Error("useMovesLikeGyro must be used within GyroProvider");
  }
  return ctx;
}
