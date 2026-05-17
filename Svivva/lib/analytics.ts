declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  gtag("event", eventName, params);
}

function getGadsId(): string | undefined {
  if (typeof window !== "undefined") {
    return (window as unknown as Record<string, string>).__GADS_ID__;
  }
  return undefined;
}

export function trackSignup(method: string = "replit_oidc") {
  trackEvent("sign_up", { method });
  const gadsId = getGadsId();
  if (gadsId) {
    trackEvent("conversion", {
      send_to: `${gadsId}/signup`,
      event_category: "engagement",
      event_label: "user_signup",
    });
  }
}

export function trackAppCreation(projectName?: string) {
  trackEvent("app_creation", {
    event_category: "engagement",
    event_label: projectName || "new_app",
  });
  const gadsId = getGadsId();
  if (gadsId) {
    trackEvent("conversion", {
      send_to: `${gadsId}/app_creation`,
      event_category: "engagement",
      event_label: "app_created",
    });
  }
}

export function trackUpgrade(plan: string) {
  trackEvent("upgrade_intent", {
    event_category: "revenue",
    event_label: plan,
    value: plan === "pro" ? 49 : plan === "enterprise" ? 199 : 0,
    currency: "USD",
  });
  const gadsId = getGadsId();
  if (gadsId) {
    trackEvent("conversion", {
      send_to: `${gadsId}/upgrade`,
      event_category: "revenue",
      event_label: `upgrade_${plan}`,
    });
  }
}

export function trackButtonClick(buttonName: string, pageLocation?: string) {
  trackEvent("cta_click", {
    event_category: "engagement",
    event_label: buttonName,
    page_location: pageLocation,
  });
}

export function trackPageView(pagePath: string, pageTitle?: string) {
  trackEvent("page_view", {
    page_path: pagePath,
    page_title: pageTitle ?? (typeof document !== "undefined" ? document.title : undefined),
  });
}

export function trackScrollDepth(percent: number, pagePath: string) {
  trackEvent("scroll_depth", { percent, page_path: pagePath });
}

export function trackSignupStart(method: string = "replit_oidc") {
  trackEvent("signup_start", { method });
}

export function trackToolUse(toolSlug: string, toolName?: string) {
  trackEvent("tool_use", { tool_slug: toolSlug, tool_name: toolName ?? toolSlug });
}

export function trackEmailCapture(source: string) {
  trackEvent("email_capture", { source });
}

export function trackExitIntent(pagePath: string) {
  trackEvent("exit_intent", { page_path: pagePath });
}
