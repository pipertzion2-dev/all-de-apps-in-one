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
