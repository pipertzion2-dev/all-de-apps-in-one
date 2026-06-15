"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Reset scroll when entering a feature route from the homepage cube. */
export function FeatureScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
