/**
 * All workspace projects for Orbit (Launchpad presets, run-step fallbacks).
 * Prefer NEXT_PUBLIC_*; defaults target the live Svivva site instead of legacy Replit hosts.
 */
const DEFAULT_SITE = "https://svivva.com";

function trimUrl(u: string): string {
  return u.trim().replace(/\/$/, "");
}

/** Public security tools hub (indexed; drives organic traffic). */
export function getSecurityToolsHubUrl(): string {
  const env =
    process.env.NEXT_PUBLIC_SECURITY_TOOLS_URL?.trim() ||
    process.env.NEXT_PUBLIC_CYBER_SECURITY_MINI_APPS_URL?.trim();
  if (env) return trimUrl(env);
  return `${DEFAULT_SITE}/cyber-security-mini-apps`;
}

/** @deprecated Legacy Clutety path — redirects to security hub */
export function getClutetyMainAppUrl(): string {
  const env =
    process.env.NEXT_PUBLIC_CLUTETY_MAIN_URL?.trim() ||
    process.env.NEXT_PUBLIC_PYRACRYPT_MAIN_URL?.trim();
  if (env) return trimUrl(env);
  return getSecurityToolsHubUrl();
}

/** @deprecated Use getClutetyMainAppUrl */
export function getPyracryptMainAppUrl(): string {
  return getClutetyMainAppUrl();
}

/** Mini-tools / hub base URL (sitemap + tool discovery). */
export function getClutetyMiniAppsBaseUrl(): string {
  const env =
    process.env.NEXT_PUBLIC_CLUTETY_MINI_APPS_URL?.trim() ||
    process.env.NEXT_PUBLIC_PYRACRYPT_MINI_APPS_URL?.trim() ||
    process.env.NEXT_PUBLIC_AI_TOOLS_HUB_URL?.trim();
  if (env) return trimUrl(env);
  return `${DEFAULT_SITE}/ai-tools-hub`;
}

/** @deprecated Use getClutetyMiniAppsBaseUrl */
export function getPyracryptMiniAppsBaseUrl(): string {
  return getClutetyMiniAppsBaseUrl();
}

/** AI Tools Hub - collection of AI generators and tools. */
export function getAiToolsHubUrl(): string {
  const env = process.env.NEXT_PUBLIC_AI_TOOLS_HUB_URL?.trim();
  if (env) return trimUrl(env);
  return `${DEFAULT_SITE}/ai-tools-hub`;
}

/** Cyber Security Mini Apps - security tools and utilities. */
export function getCyberSecurityMiniAppsUrl(): string {
  return getSecurityToolsHubUrl();
}

/** Svivva SEO Pack - SEO tools and resources. */
export function getSvivvaSeoPackUrl(): string {
  const env = process.env.NEXT_PUBLIC_SVIVVA_SEO_PACK_URL?.trim();
  if (env) return trimUrl(env);
  return `${DEFAULT_SITE}/seo-pack`;
}

/** Marketing Hub - campaigns, leads, referrals, UTM, content amplification, A/B tests. */
export function getMarketingHubUrl(): string {
  return `${DEFAULT_SITE}/marketing-hub`;
}

/** Logged-in Security Center (not for sitemap / organic). */
export function getSecurityCenterUrl(): string {
  return `${DEFAULT_SITE}/dashboard/security`;
}

/** Get all workspace projects for Orbit autopilot and marketing. */
export function getAllWorkspaceProjects(): Array<{
  name: string;
  url: string;
  category: string;
  description: string;
}> {
  return [
    {
      name: "Svivva",
      url: DEFAULT_SITE,
      category: "main",
      description: "AI-powered app builder — the core platform",
    },
    {
      name: "Cyber Security Mini Apps",
      url: getCyberSecurityMiniAppsUrl(),
      category: "security-tools",
      description: "Free security scanners, feed tools & hardening utilities on Svivva",
    },
    {
      name: "AI Tools Hub",
      url: getAiToolsHubUrl(),
      category: "ai-tools",
      description: "Collection of AI generators and utilities",
    },
    {
      name: "Svivva SEO Pack",
      url: getSvivvaSeoPackUrl(),
      category: "seo-tools",
      description: "SEO auditing, keyword research & optimization",
    },
    {
      name: "Marketing Hub",
      url: getMarketingHubUrl(),
      category: "marketing",
      description: "Campaigns, leads, referrals, UTM tracking & A/B tests",
    },
    {
      name: "Security Center",
      url: getSecurityCenterUrl(),
      category: "security-app",
      description: "Feed Shield & threat scanner for logged-in users",
    },
  ];
}

export function hostnameFromHttpUrl(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
}

/** Launchpad preset card + Launch Everything fallback when no tools URL is set. */
export function getClutetyOrbitPreset() {
  return {
    name: "Security Tools",
    sourceUrl: getCyberSecurityMiniAppsUrl(),
    miniAppsUrl: getClutetyMiniAppsBaseUrl(),
    description:
      "Organic funnel: /cyber-security-mini-apps + /ai-tools-hub. Logged-in features at /dashboard/security.",
  };
}

/** @deprecated Use getClutetyOrbitPreset */
export function getPyracryptOrbitPreset() {
  return getClutetyOrbitPreset();
}

/** GoDaddy CNAME targets when the user has not connected tool URLs in Orbit. */
export function getDefaultSubdomainCnameTargets(): {
  sub: string;
  target: string;
  label: string;
}[] {
  const miniHost = hostnameFromHttpUrl(getClutetyMiniAppsBaseUrl());
  const securityHost = hostnameFromHttpUrl(getCyberSecurityMiniAppsUrl());
  if (miniHost && securityHost) {
    return [
      { sub: "apps", target: miniHost, label: "AI & mini apps hub" },
      { sub: "security", target: securityHost, label: "Cyber security tools" },
      { sub: "tools", target: miniHost, label: "Tools alias" },
    ];
  }
  return [
    {
      sub: "apps",
      target: "svivva.com",
      label: "Mini apps (set NEXT_PUBLIC_AI_TOOLS_HUB_URL)",
    },
    {
      sub: "security",
      target: "svivva.com",
      label: "Security tools (cyber-security-mini-apps)",
    },
  ];
}
