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
  // AP Science learning funnel
  landing_view: { category: "ap_science", params: ["page_path"] },
  onboarding_started: { category: "ap_science", params: ["course"] },
  onboarding_completed: { category: "ap_science", params: ["course", "examWindow", "confidence"] },
  subject_selected: { category: "ap_science", params: ["course"] },
  exam_date_selected: { category: "ap_science", params: ["examWindow"] },
  first_visualization_interaction: {
    category: "ap_science",
    params: ["concept_id", "molecule_id"],
  },
  first_question_answered: { category: "ap_science", params: ["question_id"] },
  first_correct_answer: { category: "ap_science", params: ["question_id", "confidence"] },
  question_incorrect: {
    category: "ap_science",
    params: ["question_id", "confidence", "misconception"],
  },
  guided_started: { category: "ap_science", params: ["molecule_id"] },
  guided_prediction: {
    category: "ap_science",
    params: ["molecule_id", "step", "correct"],
  },
  paywall_viewed: { category: "ap_science", params: ["source"] },
  first_mastery_gain: { category: "ap_science", params: ["concept_id", "score"] },
} as const;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

export function buildAnalyticsMap() {
  return {
    generatedAt: new Date().toISOString(),
    provider: "ga4",
    events: ANALYTICS_EVENTS,
    funnels: {
      top: ["page_view", "scroll_depth", "cta_click", "landing_view"],
      mid: ["email_capture", "tool_use", "onboarding_started", "first_visualization_interaction"],
      bottom: [
        "signup_start",
        "signup_complete",
        "first_question_answered",
        "paywall_viewed",
        "conversion",
      ],
      ap_science: [
        "landing_view",
        "onboarding_started",
        "subject_selected",
        "first_visualization_interaction",
        "guided_prediction",
        "first_question_answered",
        "first_correct_answer",
        "paywall_viewed",
      ],
    },
  };
}
