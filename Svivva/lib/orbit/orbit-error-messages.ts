import {
  describeOrbitAiAlternatives,
  getOrbitAiAlternatives,
  orbitAiAlternativeActions,
} from "@/lib/orbit/orbit-ai-alternatives";

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
  if (m.includes("no ai provider") || m.includes("not configured")) {
    return "ai-not-configured";
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
  /** Named alternatives when the primary service failed */
  alternatives?: { name: string; why: string; href: string }[];
};

export type OrbitRunErrorContext = {
  tierId?: string | null;
  model?: string | null;
  failedProvider?: string | null;
};

function isStandardEasyPeasyTier(tierId: string | null | undefined): boolean {
  const t = tierId?.trim().toLowerCase();
  return !t || t === "standard";
}

function aiNotConfiguredHint(raw: string): OrbitRunErrorHint {
  const alts = getOrbitAiAlternatives(["easypeasy"]);
  return {
    title: "No working AI provider",
    detail: `${raw} ${describeOrbitAiAlternatives(["easypeasy"])}`,
    actions: orbitAiAlternativeActions(["easypeasy"]),
    alternatives: alts.map((a) => ({ name: a.name, why: a.why, href: a.setupHref })),
  };
}

export function formatOrbitRunError(
  raw: string,
  ctx: OrbitRunErrorContext = {},
): OrbitRunErrorHint {
  const m = raw.toLowerCase();

  if (
    m.includes("no ai provider") ||
    (m.includes("not configured") && (m.includes("ai") || m.includes("easypeasy")))
  ) {
    return aiNotConfiguredHint(raw);
  }

  if (isEasyPeasyWordLimitError(raw)) {
    const altActions = orbitAiAlternativeActions(["easypeasy"]);
    const alts = getOrbitAiAlternatives(["easypeasy"]).map((a) => ({
      name: a.name,
      why: a.why,
      href: a.setupHref,
    }));
    if (isStandardEasyPeasyTier(ctx.tierId)) {
      return {
        title: "EasyPeasy word limit reached — switch provider",
        detail: `EasyPeasy quota is used up. ${describeOrbitAiAlternatives(["easypeasy"])}`,
        actions: altActions,
        alternatives: alts,
      };
    }
    return {
      title: "EasyPeasy word limit reached — switch provider",
      detail: `Premium models burn through EasyPeasy quota fast. ${describeOrbitAiAlternatives(["easypeasy"])}`,
      actions: altActions,
      alternatives: alts,
    };
  }

  if (
    m.includes("easypeasy") &&
    (m.includes("not configured") || m.includes("fail") || m.includes("connection"))
  ) {
    return {
      title: "EasyPeasy isn't working — use another AI",
      detail: `${raw} ${describeOrbitAiAlternatives(["easypeasy"])}`,
      actions: orbitAiAlternativeActions(["easypeasy"]),
      alternatives: getOrbitAiAlternatives(["easypeasy"]).map((a) => ({
        name: a.name,
        why: a.why,
        href: a.setupHref,
      })),
    };
  }

  if (m.includes("401") || m.includes("403") || m.includes("invalid api key")) {
    return {
      title: "AI API key rejected",
      detail: `${raw} Check the key in Platform Secrets or pick another provider. ${describeOrbitAiAlternatives()}`,
      actions: [
        { label: "Platform Secrets", href: "/dashboard/settings/runtime-keys" },
        ...orbitAiAlternativeActions(),
      ],
    };
  }

  if (m.includes("quota exceeded") && m.includes("indexing")) {
    return {
      title: "Google Indexing API quota hit for today",
      detail:
        "You already submitted via IndexNow and Search Console. The Indexing API cap (~200/day) resets overnight — indexing is not blocked overall.",
      actions: [
        { label: "GSC setup", href: "/dashboard/gsc-connect" },
        { label: "IndexNow (free)", href: "/dashboard/launchpad#orbit-indexnow" },
      ],
    };
  }

  if (m.includes("stripe") && (m.includes("reject") || m.includes("invalid"))) {
    return {
      title: "Stripe keys need attention",
      detail: raw,
      actions: [
        { label: "Stripe setup", href: "/dashboard/launchpad#orbit-stripe" },
        { label: "Platform Secrets", href: "/dashboard/settings/runtime-keys" },
      ],
    };
  }

  if (m.includes("gsc") || m.includes("search console") || m.includes("google oauth")) {
    return {
      title: "Google Search Console not connected",
      detail: raw,
      actions: [
        { label: "Connect GSC", href: "/dashboard/gsc-connect" },
        { label: "Manual setup guide", href: "/dashboard/launchpad#orbit-manual" },
      ],
    };
  }

  return {
    title: "Run failed",
    detail: raw,
    actions: orbitAiAlternativeActions().slice(0, 1),
  };
}
