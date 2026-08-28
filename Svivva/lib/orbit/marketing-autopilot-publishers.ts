import crypto from "crypto";
import type { MarketingPlatformCredentials } from "./marketing-autopilot-types";

const USER_AGENT = "SvivvaMarketingAutopilot/1.0";

function percentEncode(s: string): string {
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function oauth1AuthHeader(
  method: string,
  url: string,
  bodyParams: Record<string, string>,
  creds: Pick<
    MarketingPlatformCredentials,
    "twitterApiKey" | "twitterApiSecret" | "twitterAccessToken" | "twitterAccessSecret"
  >,
): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.twitterApiKey!,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.twitterAccessToken!,
    oauth_version: "1.0",
  };
  const all = { ...bodyParams, ...oauth };
  const paramString = Object.keys(all)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(all[k])}`)
    .join("&");
  const base = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join("&");
  const signingKey = `${percentEncode(creds.twitterApiSecret!)}&${percentEncode(creds.twitterAccessSecret!)}`;
  oauth.oauth_signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");
  return (
    "OAuth " +
    Object.entries(oauth)
      .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
      .join(", ")
  );
}

export type PublishResult = { ok: boolean; url?: string; error?: string; id?: string };

const OMNISOCIALS_BASE = "https://api.omnisocials.com/v1";

/** List connected social accounts (linkedin, x, etc.) */
export async function listOmniSocialsAccounts(
  apiKey: string,
): Promise<{ ok: boolean; accounts?: { id: string; platform?: string }[]; error?: string }> {
  try {
    const res = await fetch(`${OMNISOCIALS_BASE}/accounts`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = (await res.json()) as {
      data?: { id: string; platform?: string }[];
      accounts?: { id: string; platform?: string }[];
      error?: { message?: string };
    };
    if (!res.ok) {
      return { ok: false, error: data.error?.message || `HTTP ${res.status}` };
    }
    const accounts = data.data ?? data.accounts ?? [];
    return { ok: true, accounts };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function resolveOmniAccounts(
  accounts: { id: string; platform?: string }[] | undefined,
  platforms: string[],
): string[] {
  if (!accounts?.length) return platforms;
  const out: string[] = [];
  for (const p of platforms) {
    const match = accounts.find((a) => {
      const plat = (a.platform ?? a.id).toLowerCase();
      return plat === p || plat.includes(p) || a.id.toLowerCase().endsWith(`_${p}`);
    });
    out.push(match?.id ?? p);
  }
  return out;
}

/** Publish to LinkedIn, X, etc. via OmniSocials create-and-publish */
export async function publishOmniSocialsPost(
  apiKey: string,
  opts: {
    text: string;
    platforms: string[];
    linkUrl?: string;
    linkTitle?: string;
    linkDescription?: string;
  },
): Promise<PublishResult> {
  try {
    const listed = await listOmniSocialsAccounts(apiKey);
    const accountIds = resolveOmniAccounts(listed.accounts, opts.platforms);

    const body: Record<string, unknown> = {
      content: { default: opts.text.slice(0, 3000) },
      accounts: accountIds,
      publish_now: true,
      source: "svivva-orbit",
    };
    if (opts.linkUrl) {
      body.link_url = opts.linkUrl;
      if (opts.linkTitle) body.link_title = opts.linkTitle;
      if (opts.linkDescription) body.link_description = opts.linkDescription;
    }

    const res = await fetch(`${OMNISOCIALS_BASE}/posts/create-and-publish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as {
      data?: { id?: string; url?: string; status?: string };
      error?: { message?: string };
    };
    if (!res.ok) {
      return { ok: false, error: data.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true, id: data.data?.id, url: data.data?.url };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

const POSTIZ_CLOUD_BASE = "https://api.postiz.com/public/v1";

/**
 * Postiz public API base. Self-hosted instances serve it from their own domain
 * under /api/public/v1; the managed cloud uses api.postiz.com/public/v1.
 */
export function postizApiBase(apiUrl?: string): string {
  const raw = apiUrl?.trim().replace(/\/+$/, "");
  if (!raw) return POSTIZ_CLOUD_BASE;
  if (/\/public\/v1$/i.test(raw)) return raw;
  if (/\/api$/i.test(raw)) return `${raw}/public/v1`;
  return `${raw}/api/public/v1`;
}

export type PostizIntegration = {
  id: string;
  name?: string;
  provider?: string;
  disabled?: boolean;
};

/**
 * Postiz calls a connected account an "integration"; the UI calls it a channel.
 * Provider ids double as the settings.__type discriminator when creating posts.
 */
const POSTIZ_PROVIDER_ALIASES: Record<string, string> = {
  twitter: "x",
  x: "x",
  linkedin: "linkedin",
  "linkedin-page": "linkedin-page",
  mastodon: "mastodon",
  bluesky: "bluesky",
  telegram: "telegram",
  threads: "threads",
  nostr: "nostr",
  discord: "discord",
  slack: "slack",
};

/** Providers Orbit can post to without platform-specific required settings. */
const POSTIZ_SETTINGS_FREE = new Set(["mastodon", "bluesky", "telegram", "threads", "nostr"]);

function postizSettingsFor(provider: string): Record<string, unknown> | null {
  if (provider === "x") return { __type: "x", who_can_reply_post: "everyone" };
  if (provider === "linkedin" || provider === "linkedin-page") return { __type: provider };
  if (POSTIZ_SETTINGS_FREE.has(provider)) return { __type: provider };
  // discord/slack/reddit need a channel or subreddit we do not collect — skip
  // rather than send a request Postiz will reject.
  return null;
}

function normalizePostizProvider(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const key = raw.toLowerCase();
  return POSTIZ_PROVIDER_ALIASES[key] ?? key;
}

/** List connected Postiz channels so posts can target real integration ids. */
export async function listPostizIntegrations(
  creds: Pick<MarketingPlatformCredentials, "postizApiKey" | "postizApiUrl">,
): Promise<{ ok: boolean; integrations?: PostizIntegration[]; error?: string }> {
  const apiKey = creds.postizApiKey?.trim();
  if (!apiKey) return { ok: false, error: "Postiz API key not configured" };
  try {
    const res = await fetch(`${postizApiBase(creds.postizApiUrl)}/integrations`, {
      headers: { Authorization: apiKey, "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: text.slice(0, 200) || `HTTP ${res.status}` };

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: "Postiz returned a non-JSON integrations response" };
    }
    const rows = Array.isArray(parsed)
      ? parsed
      : ((parsed as { integrations?: unknown[]; data?: unknown[] }).integrations ??
        (parsed as { data?: unknown[] }).data ??
        []);

    const integrations: PostizIntegration[] = (rows as Record<string, unknown>[])
      .map((r) => ({
        id: String(r.id ?? ""),
        name: typeof r.name === "string" ? r.name : undefined,
        provider: normalizePostizProvider(
          (r.providerIdentifier ?? r.provider ?? r.identifier) as string | undefined,
        ),
        disabled: r.disabled === true,
      }))
      .filter((r) => r.id);

    return { ok: true, integrations };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Publish through a self-hosted or cloud Postiz instance — the free, open-source
 * path for multi-platform social posting.
 */
export async function publishPostizPost(
  creds: Pick<MarketingPlatformCredentials, "postizApiKey" | "postizApiUrl">,
  opts: { text: string; platforms: string[]; linkUrl?: string },
): Promise<PublishResult> {
  const apiKey = creds.postizApiKey?.trim();
  if (!apiKey) return { ok: false, error: "Postiz API key not configured" };

  const listed = await listPostizIntegrations(creds);
  if (!listed.ok) return { ok: false, error: listed.error };

  const wanted = new Set(
    opts.platforms.map((p) => normalizePostizProvider(p)).filter((p): p is string => !!p),
  );
  const targets = (listed.integrations ?? []).filter(
    (i) => !i.disabled && i.provider && wanted.has(i.provider),
  );
  if (!targets.length) {
    return {
      ok: false,
      error: `No connected Postiz channel for ${[...wanted].join(", ")} — connect it in Postiz first`,
    };
  }

  let content = opts.text.slice(0, 3000);
  if (opts.linkUrl && !content.includes(opts.linkUrl)) {
    content = `${content}\n\n${opts.linkUrl}`.trim();
  }

  const posts = targets
    .map((t) => {
      const settings = postizSettingsFor(t.provider!);
      if (!settings) return null;
      return {
        integration: { id: t.id },
        value: [{ content, image: [] as unknown[] }],
        settings,
      };
    })
    .filter((p): p is NonNullable<typeof p> => !!p);

  if (!posts.length) {
    return { ok: false, error: "Connected Postiz channels need settings Orbit does not collect" };
  }

  try {
    const res = await fetch(`${postizApiBase(creds.postizApiUrl)}/posts`, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        type: "now",
        date: new Date().toISOString(),
        shortLink: false,
        tags: [],
        posts,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    if (!res.ok) {
      if (res.status === 429) {
        return { ok: false, error: "Postiz rate limit reached (90 create-post calls/hour)" };
      }
      return { ok: false, error: text.slice(0, 200) || `HTTP ${res.status}` };
    }
    let id: string | undefined;
    try {
      const data = JSON.parse(text) as unknown;
      const first = Array.isArray(data) ? data[0] : data;
      const rec = first as { id?: string; postId?: string } | undefined;
      id = rec?.id ?? rec?.postId;
    } catch {
      /* Postiz returns an empty body on some versions — a 2xx is still success */
    }
    return { ok: true, id: id ?? "postiz-post" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

const AYRSHARE_POST = "https://api.ayrshare.com/api/post";

/** Multi-platform social via Ayrshare — best direct API for LinkedIn, X, Threads, etc. */
export async function publishAyrsharePost(
  apiKey: string,
  opts: {
    text: string;
    platforms: ("linkedin" | "twitter" | "threads" | "bluesky" | "reddit")[];
    linkUrl?: string;
  },
): Promise<PublishResult> {
  try {
    let post = opts.text.slice(0, 3000);
    if (opts.linkUrl && !post.includes(opts.linkUrl)) {
      post = `${post}\n\n${opts.linkUrl}`.trim();
    }
    const res = await fetch(AYRSHARE_POST, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ post, platforms: opts.platforms }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = (await res.json()) as {
      status?: string;
      id?: string;
      postIds?: { platform?: string; postUrl?: string; status?: string }[];
      posts?: { platform?: string; postUrl?: string; status?: string }[];
      message?: string;
      errors?: { message?: string }[];
    };
    if (!res.ok) {
      const err =
        data.message ||
        data.errors?.[0]?.message ||
        (typeof data === "object" ? JSON.stringify(data).slice(0, 200) : `HTTP ${res.status}`);
      return { ok: false, error: err };
    }
    const entries = data.postIds ?? data.posts ?? [];
    const success = entries.find((p) => p.status === "success") ?? entries[0];
    return {
      ok: true,
      id: data.id ?? success?.platform,
      url: success?.postUrl,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function publishDevToArticle(
  apiKey: string,
  article: { title: string; content: string; tags?: string[] },
): Promise<PublishResult> {
  try {
    const res = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        article: {
          title: article.title,
          body_markdown: article.content,
          published: true,
          tags: (article.tags ?? ["ai", "tools"]).slice(0, 4),
        },
      }),
    });
    const data = (await res.json()) as { url?: string; id?: number; error?: string };
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true, url: data.url, id: String(data.id) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function publishHashnodeArticle(
  apiKey: string,
  publicationId: string,
  article: { title: string; content: string; tags?: string[] },
): Promise<PublishResult> {
  const mutation = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post { url slug }
      }
    }`;
  try {
    const res = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            title: article.title,
            contentMarkdown: article.content,
            publicationId,
            tags: (article.tags ?? ["ai", "tools"]).map((t) => ({ slug: t })),
          },
        },
      }),
    });
    const data = (await res.json()) as {
      data?: { publishPost?: { post?: { url?: string } } };
      errors?: { message: string }[];
    };
    if (data.errors?.length) return { ok: false, error: data.errors[0].message };
    const url = data.data?.publishPost?.post?.url;
    if (!url) return { ok: false, error: "No post URL returned" };
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function getRedditAccessToken(
  creds: Pick<
    MarketingPlatformCredentials,
    "redditClientId" | "redditClientSecret" | "redditRefreshToken"
  >,
): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const auth = Buffer.from(`${creds.redditClientId}:${creds.redditClientSecret}`).toString(
      "base64",
    );
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: creds.redditRefreshToken!,
      }),
    });
    const data = (await res.json()) as { access_token?: string; error?: string };
    if (!res.ok || !data.access_token) {
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    return { ok: true, token: data.access_token };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function publishRedditPost(
  creds: MarketingPlatformCredentials,
  post: { subreddit: string; title: string; body: string },
): Promise<PublishResult> {
  const tokenRes = await getRedditAccessToken(creds);
  if (!tokenRes.ok || !tokenRes.token) return { ok: false, error: tokenRes.error };

  const sr = post.subreddit.replace(/^r\//i, "");
  try {
    const res = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenRes.token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: new URLSearchParams({
        sr,
        title: post.title,
        text: post.body,
        kind: "self",
        api_type: "json",
      }),
    });
    const data = (await res.json()) as {
      json?: { errors?: string[][]; data?: { url?: string; id?: string } };
    };
    const errors = data.json?.errors;
    if (errors?.length) return { ok: false, error: errors.flat().join(", ") };
    const url = data.json?.data?.url;
    return { ok: true, url, id: data.json?.data?.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function publishTwitterThread(
  creds: MarketingPlatformCredentials,
  tweets: string[],
): Promise<PublishResult> {
  if (
    !creds.twitterApiKey ||
    !creds.twitterApiSecret ||
    !creds.twitterAccessToken ||
    !creds.twitterAccessSecret
  ) {
    return { ok: false, error: "Twitter OAuth credentials incomplete" };
  }

  const endpoint = "https://api.twitter.com/2/tweets";
  let replyTo: string | undefined;
  let firstUrl: string | undefined;

  for (let i = 0; i < tweets.length; i++) {
    const text = tweets[i].slice(0, 280);
    const body: Record<string, unknown> = { text };
    if (replyTo) body.reply = { in_reply_to_tweet_id: replyTo };

    const bodyStr = JSON.stringify(body);
    const auth = oauth1AuthHeader("POST", endpoint, {}, creds);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: bodyStr,
      });
      const data = (await res.json()) as {
        data?: { id: string };
        errors?: { detail?: string; message?: string }[];
      };
      if (!res.ok) {
        const err = data.errors?.[0]?.detail || data.errors?.[0]?.message || `HTTP ${res.status}`;
        return { ok: false, error: err };
      }
      replyTo = data.data?.id;
      if (i === 0 && replyTo) {
        firstUrl = `https://twitter.com/i/web/status/${replyTo}`;
      }
      await new Promise((r) => setTimeout(r, 1200));
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  return { ok: true, url: firstUrl, id: replyTo };
}

export async function sendResendEmail(
  creds: MarketingPlatformCredentials,
  opts: { to: string; subject: string; html: string },
): Promise<PublishResult> {
  if (!creds.resendApiKey || !creds.outreachFromEmail) {
    return { ok: false, error: "Resend API key and from email required" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: creds.outreachFromEmail,
        to: opts.to,
        reply_to: creds.outreachReplyTo || creds.outreachFromEmail,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    const data = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message || `HTTP ${res.status}` };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export type N8nMarketingPayload = {
  event: "orbit.marketing_autopilot.complete";
  siteUrl: string;
  startedAt: string;
  finishedAt: string;
  stats: {
    posted: number;
    prepared: number;
    done: number;
    failed: number;
    needsCredentials: number;
  };
  indexing?: unknown;
  social: unknown;
  outreach: unknown;
  parasite: unknown;
  directories: unknown;
  tasks: { id: string; label: string; status: string; message: string; copyText?: string }[];
};

/** POST full marketing pack to user's n8n workflow webhook. */
export async function dispatchN8nMarketingWebhook(
  creds: Pick<MarketingPlatformCredentials, "n8nWebhookUrl" | "n8nWebhookSecret">,
  payload: N8nMarketingPayload,
): Promise<PublishResult> {
  const url = creds.n8nWebhookUrl?.trim();
  if (!url) return { ok: false, error: "n8n webhook URL not configured" };
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "SvivvaOrbit/1.0",
    };
    const secret = creds.n8nWebhookSecret?.trim();
    if (secret) headers["X-Orbit-Secret"] = secret;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: text.slice(0, 200) || `HTTP ${res.status}` };
    }
    return { ok: true, id: "n8n-webhook" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
