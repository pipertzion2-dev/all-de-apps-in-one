"use client";

import { useEffect } from "react";
import { trackApLearnEvent } from "@/lib/ap-science/client-store";

export function ApLandingTracker() {
  useEffect(() => {
    trackApLearnEvent("landing_view", { page_path: "/lp/ap-science" });
  }, []);
  return null;
}
