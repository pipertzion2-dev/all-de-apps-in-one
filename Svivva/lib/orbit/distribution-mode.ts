import type {
  AutopilotTaskStatus,
  MarketingPlatformCredentials,
} from "./marketing-autopilot-types";

function hasTwitterOAuth(creds: MarketingPlatformCredentials): boolean {
  return !!(
    creds.twitterApiKey?.trim() &&
    creds.twitterApiSecret?.trim() &&
    creds.twitterAccessToken?.trim() &&
    creds.twitterAccessSecret?.trim()
  );
}

/** True when any outbound API (social, email, n8n, dev platforms) is configured. */
export function hasAutoPostCredentials(creds: MarketingPlatformCredentials): boolean {
  return !!(
    creds.n8nWebhookUrl?.trim() ||
    creds.postizApiKey?.trim() ||
    creds.ayrshareApiKey?.trim() ||
    creds.omnisocialsApiKey?.trim() ||
    (creds.resendApiKey?.trim() && creds.outreachFromEmail?.trim()) ||
    hasTwitterOAuth(creds) ||
    (creds.redditClientId?.trim() &&
      creds.redditClientSecret?.trim() &&
      creds.redditRefreshToken?.trim()) ||
    creds.devtoApiKey?.trim() ||
    (creds.hashnodeApiKey?.trim() && creds.hashnodePublicationId?.trim())
  );
}

/**
 * Indexing + on-site SEO stay fully automated; outbound posts become copy-ready only.
 * Force with ORBIT_COPY_ONLY=1 or ORBIT_SKIP_AUTO_POST=1 in Vercel.
 */
export function isCopyOnlyDistributionMode(creds: MarketingPlatformCredentials): boolean {
  const forced =
    process.env.ORBIT_COPY_ONLY === "1" ||
    process.env.ORBIT_SKIP_AUTO_POST === "1" ||
    process.env.ORBIT_SKIP_AUTO_POST?.toLowerCase() === "true";
  if (forced) return true;
  return !hasAutoPostCredentials(creds);
}

export function copyReadyOrNeedsCredentials(opts: {
  copyOnly: boolean;
  needsCredentialsMessage: string;
  copyOnlyMessage?: string;
}): { status: AutopilotTaskStatus; message: string } {
  if (opts.copyOnly) {
    return {
      status: "prepared",
      message:
        opts.copyOnlyMessage ??
        "Copy saved to Growth Content — optional manual post (auto-post off)",
    };
  }
  return { status: "needs_credentials", message: opts.needsCredentialsMessage };
}
