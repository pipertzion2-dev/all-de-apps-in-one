"use client";

import { ScrollDepthTracker } from "@/components/seo/scroll-depth-tracker";

/** Mount on public marketing layouts for page_view + scroll_depth. */
export function MarketingAnalytics() {
  return <ScrollDepthTracker />;
}
