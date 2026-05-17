/** Core Web Vitals targets and static performance recommendations. */

export const CWV_BUDGET = {
  LCP_MS: 2500,
  INP_MS: 200,
  CLS: 0.1,
} as const;

export type PerformanceReport = {
  generatedAt: string;
  targets: typeof CWV_BUDGET;
  recommendations: string[];
  headersConfigured: boolean;
  imageOptimization: boolean;
};

export function buildPerformanceReport(config: {
  hasImageConfig: boolean;
  hasCacheHeaders: boolean;
}): PerformanceReport {
  const recommendations: string[] = [];
  if (!config.hasImageConfig) {
    recommendations.push("Enable next/image remotePatterns and priority for LCP hero");
  }
  if (!config.hasCacheHeaders) {
    recommendations.push("Add Cache-Control for static assets and ISR pages");
  }
  recommendations.push("Defer non-critical scripts; preload primary font");
  recommendations.push("Code-split dashboard routes from marketing bundle");
  recommendations.push("Lazy-load below-fold images and related sections");

  return {
    generatedAt: new Date().toISOString(),
    targets: CWV_BUDGET,
    recommendations,
    headersConfigured: config.hasCacheHeaders,
    imageOptimization: config.hasImageConfig,
  };
}
