/** Turn raw API errors into short, actionable Orbit admin copy. */

export function isEasyPeasyWordLimitError(message: string | null | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("429") ||
    m.includes("allowed words") ||
    m.includes("word limit") ||
    (m.includes("limit") && m.includes("plan"))
  );
}

export function dedupeErrorMessages(errors: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of errors) {
    const key = normalizeErrorKey(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(formatIndexingApiError(raw));
  }
  return out;
}

function normalizeErrorKey(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("publish requests per day") || m.includes("quota exceeded")) {
    return "google-indexing-daily-quota";
  }
  if (m.includes("allowed words") || m.includes("word limit")) {
    return "easypeasy-word-limit";
  }
  return m.replace(/\s+/g, " ").trim().slice(0, 120);
}

export function formatIndexingApiError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("publish requests") && m.includes("quota")) {
    return "Google Indexing API daily quota reached (~200 URLs/day). IndexNow + GSC sitemap still work — quota resets tomorrow.";
  }
  if (m.includes("indexing api") && m.includes("disabled")) {
    return "Google Indexing API is disabled for this project — enable it in Google Cloud Console.";
  }
  return message.length > 160 ? `${message.slice(0, 157)}…` : message;
}

export type OrbitRunErrorHint = {
  title: string;
  detail: string;
  actions: { label: string; href: string }[];
};

export type OrbitRunErrorContext = {
  tierId?: string | null;
  model?: string | null;
};

function isStandardEasyPeasyTier(tierId: string | null | undefined): boolean {
  const t = tierId?.trim().toLowerCase();
  return !t || t === "standard";
}

export function formatOrbitRunError(
  raw: string,
  ctx: OrbitRunErrorContext = {},
): OrbitRunErrorHint {
  const m = raw.toLowerCase();

  if (isEasyPeasyWordLimitError(raw)) {
    if (isStandardEasyPeasyTier(ctx.tierId)) {
      return {
        title: "EasyPeasy free-tier word limit reached",
        detail:
          "Standard tier (gemini-3-flash) is active — your EasyPeasy plan word allowance is used up. Upgrade at easy-peasy.ai/pricing, wait for the quota reset, or add GEMINI_API_KEY in Platform Secrets for free daily Orbit runs.",
        actions: [
          { label: "EasyPeasy pricing", href: "https://easy-peasy.ai/pricing" },
          { label: "Platform Secrets (Gemini)", href: "/dashboard/settings/runtime-keys" },
        ],
      };
    }
    return {
      title: "EasyPeasy word limit reached",
      detail:
        "Premium or balanced models burn through your EasyPeasy word quota fast. Switch to Standard tier (gemini-3-flash) or add GEMINI_API_KEY for free daily runs.",
      actions: [
        { label: "EasyPeasy tier settings", href: "/dashboard/launchpad#orbit-easypeasy-setup" },
        { label: "Platform Secrets (Gemini)", href: "/dashboard/settings/runtime-keys" },
      ],
    };
  }

  if (m.includes("quota exceeded") && m.includes("indexing")) {
    return {
      title: "Google Indexing API quota hit for today",
      detail:
        "You already submitted via IndexNow and Search Console. The Indexing API cap (~200/day) resets overnight — indexing is not blocked overall.",
      actions: [{ label: "GSC setup", href: "/dashboard/gsc-connect" }],
    };
  }

  if (m.includes("easypeasy") && m.includes("not configured")) {
    return {
      title: "EasyPeasy not configured",
      detail: raw,
      actions: [{ label: "EasyPeasy setup", href: "/dashboard/launchpad#orbit-easypeasy-setup" }],
    };
  }

  return {
    title: "Run failed",
    detail: raw,
    actions: [],
  };
}
