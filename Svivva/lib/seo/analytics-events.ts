/**
 * Event architecture map — consumed by analytics_map.json generator and trackEvent callers.
 */
export const ANALYTICS_EVENTS = {
  page_view: { category: "discovery", params: ["page_path", "page_title"] },
  scroll_depth: { category: "engagement", params: ["percent", "page_path"] },
  cta_click: { category: "engagement", params: ["label", "page_location"] },
  signup_start: { category: "conversion", params: ["method"] },
  signup_complete: { category: "conversion", params: ["method"] },
  tool_use: { category: "product", params: ["tool_slug", "tool_name"] },
  retention: { category: "retention", params: ["days_since_signup"] },
  conversion: { category: "revenue", params: ["plan", "value"] },
  exit_intent: { category: "conversion", params: ["page_path"] },
  email_capture: { category: "conversion", params: ["source"] },
} as const;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

export function buildAnalyticsMap() {
  return {
    generatedAt: new Date().toISOString(),
    provider: "ga4",
    events: ANALYTICS_EVENTS,
    funnels: {
      top: ["page_view", "scroll_depth", "cta_click"],
      mid: ["email_capture", "tool_use"],
      bottom: ["signup_start", "signup_complete", "conversion"],
    },
  };
}
