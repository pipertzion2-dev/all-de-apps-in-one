/**
 * Pyracrypt / mini-apps URLs for Orbit (Launchpad presets, run-step fallbacks).
 * Prefer NEXT_PUBLIC_*; defaults target the live Svivva site instead of legacy Replit hosts.
 */
const DEFAULT_SITE = "https://svivva.com";

function trimUrl(u: string): string {
  return u.trim().replace(/\/$/, "");
}

/** Main Pyracrypt product / landing (used for CNAME presets and links). */
export function getPyracryptMainAppUrl(): string {
  const env = process.env.NEXT_PUBLIC_PYRACRYPT_MAIN_URL?.trim();
  if (env) return trimUrl(env);
  return `${DEFAULT_SITE}/pyracrypt`;
}

/** Mini-tools / hub base URL (sitemap + tool discovery). */
export function getPyracryptMiniAppsBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_PYRACRYPT_MINI_APPS_URL?.trim();
  if (env) return trimUrl(env);
  return `${DEFAULT_SITE}/ai-tools-hub`;
}

export function hostnameFromHttpUrl(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
}

/** Launchpad preset card + Launch Everything fallback when no tools URL is set. */
export function getPyracryptOrbitPreset() {
  return {
    name: "Pyracrypt",
    sourceUrl: getPyracryptMainAppUrl(),
    miniAppsUrl: getPyracryptMiniAppsBaseUrl(),
    description:
      "Defaults use svivva.com; override with NEXT_PUBLIC_PYRACRYPT_* in .env if your apps live elsewhere.",
  };
}

/** GoDaddy CNAME targets when the user has not connected tool URLs in Orbit. */
export function getDefaultSubdomainCnameTargets(): {
  sub: string;
  target: string;
  label: string;
}[] {
  const miniHost = hostnameFromHttpUrl(getPyracryptMiniAppsBaseUrl());
  const mainHost = hostnameFromHttpUrl(getPyracryptMainAppUrl());
  if (miniHost && mainHost) {
    return [
      { sub: "apps", target: miniHost, label: "Mini apps hub" },
      { sub: "security", target: mainHost, label: "Pyracrypt main" },
      { sub: "pyracrypt", target: mainHost, label: "Pyracrypt alias" },
    ];
  }
  return [
    {
      sub: "apps",
      target: "svivva.com",
      label: "Mini apps (set NEXT_PUBLIC_PYRACRYPT_MINI_APPS_URL)",
    },
    {
      sub: "security",
      target: "svivva.com",
      label: "Main app (set NEXT_PUBLIC_PYRACRYPT_MAIN_URL)",
    },
    { sub: "pyracrypt", target: "svivva.com", label: "Alias" },
  ];
}
