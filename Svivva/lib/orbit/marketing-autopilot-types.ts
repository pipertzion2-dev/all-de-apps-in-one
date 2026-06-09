/** Marketing Autopilot — credentials, tasks, and run results */

export type MarketingPlatformCredentials = {
  devtoApiKey?: string;
  hashnodeApiKey?: string;
  hashnodePublicationId?: string;
  twitterApiKey?: string;
  twitterApiSecret?: string;
  twitterAccessToken?: string;
  twitterAccessSecret?: string;
  redditClientId?: string;
  redditClientSecret?: string;
  redditRefreshToken?: string;
  redditDefaultSubreddit?: string;
  resendApiKey?: string;
  outreachFromEmail?: string;
  outreachReplyTo?: string;
  newsletterPitchEmail?: string;
  podcastPitchEmail?: string;
};

export type MarketingCredentialField = {
  key: keyof MarketingPlatformCredentials;
  label: string;
  hint: string;
  secret?: boolean;
  group: "publishing" | "social" | "email";
};

export const MARKETING_CREDENTIAL_FIELDS: MarketingCredentialField[] = [
  {
    key: "devtoApiKey",
    label: "Dev.to API key",
    hint: "dev.to/settings/extensions → Generate API Key",
    secret: true,
    group: "publishing",
  },
  {
    key: "hashnodeApiKey",
    label: "Hashnode API key",
    hint: "hashnode.com/settings/developer",
    secret: true,
    group: "publishing",
  },
  {
    key: "hashnodePublicationId",
    label: "Hashnode publication ID",
    hint: "From your publication URL / dashboard",
    group: "publishing",
  },
  {
    key: "twitterApiKey",
    label: "Twitter/X API key (consumer)",
    hint: "developer.twitter.com → App keys",
    secret: true,
    group: "social",
  },
  {
    key: "twitterApiSecret",
    label: "Twitter/X API secret",
    secret: true,
    group: "social",
  },
  {
    key: "twitterAccessToken",
    label: "Twitter/X access token",
    secret: true,
    group: "social",
  },
  {
    key: "twitterAccessSecret",
    label: "Twitter/X access token secret",
    secret: true,
    group: "social",
  },
  {
    key: "redditClientId",
    label: "Reddit client ID",
    hint: "reddit.com/prefs/apps → script/web app",
    group: "social",
  },
  {
    key: "redditClientSecret",
    label: "Reddit client secret",
    secret: true,
    group: "social",
  },
  {
    key: "redditRefreshToken",
    label: "Reddit refresh token",
    secret: true,
    group: "social",
  },
  {
    key: "redditDefaultSubreddit",
    label: "Default subreddit (no r/)",
    hint: "e.g. SideProject",
    group: "social",
  },
  {
    key: "resendApiKey",
    label: "Resend API key",
    hint: "resend.com/api-keys — for newsletter/podcast pitches",
    secret: true,
    group: "email",
  },
  {
    key: "outreachFromEmail",
    label: "From email (verified in Resend)",
    group: "email",
  },
  {
    key: "outreachReplyTo",
    label: "Reply-to email",
    group: "email",
  },
  {
    key: "newsletterPitchEmail",
    label: "Newsletter pitch recipient",
    hint: "e.g. tips@tldr.tech",
    group: "email",
  },
  {
    key: "podcastPitchEmail",
    label: "Podcast pitch recipient",
    group: "email",
  },
];

export type AutopilotTaskStatus =
  | "done"
  | "posted"
  | "prepared"
  | "skipped"
  | "failed"
  | "needs_credentials"
  | "running";

export type AutopilotTaskResult = {
  id: string;
  label: string;
  group: string;
  status: AutopilotTaskStatus;
  message: string;
  url?: string;
  at?: string;
};

export type MarketingAutopilotRunResult = {
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  tasks: AutopilotTaskResult[];
  summary: string;
  stats: {
    posted: number;
    prepared: number;
    done: number;
    failed: number;
    needsCredentials: number;
  };
  contentGenerated: boolean;
};

export type MarketingCredentialStatus = {
  configured: Partial<Record<keyof MarketingPlatformCredentials, boolean>>;
  google: {
    serviceAccount: boolean;
    siteUrl: boolean;
    indexNow: boolean;
  };
};

/** Mask secrets for API responses — only returns whether each field is set */
export function maskCredentialsForClient(
  creds: MarketingPlatformCredentials,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(creds)) {
    if (!v) continue;
    const secretKeys = ["ApiKey", "Secret", "Token", "Pass"];
    const isSecret = secretKeys.some((s) => k.includes(s));
    out[k] = isSecret ? "••••••••" : v;
  }
  return out;
}
