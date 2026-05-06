import { createSign } from "crypto";

interface ServiceAccount {
  private_key: string;
  client_email: string;
  token_uri: string;
}

function base64url(str: string | Buffer): string {
  const b = typeof str === "string" ? Buffer.from(str) : str;
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getGoogleAccessToken(serviceAccount: ServiceAccount, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope,
    aud: serviceAccount.token_uri,
    exp: now + 3600,
    iat: now,
  }));

  const sigInput = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(sigInput);
  const signature = base64url(sign.sign(serviceAccount.private_key));
  const jwt = `${sigInput}.${signature}`;

  const res = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

export async function submitUrlsToGoogleIndexingApi(serviceAccountJson: string, urls: string[]): Promise<{ submitted: number; errors: string[] }> {
  const sa: ServiceAccount = JSON.parse(serviceAccountJson);
  const token = await getGoogleAccessToken(sa, "https://www.googleapis.com/auth/indexing");

  const results = await Promise.allSettled(
    urls.map((url) =>
      fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, type: "URL_UPDATED" }),
        signal: AbortSignal.timeout(8000),
      })
    )
  );

  const errors: string[] = [];
  let submitted = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.ok) {
      submitted++;
    } else if (r.status === "rejected") {
      errors.push(r.reason?.message || "Network error");
    } else if (r.status === "fulfilled") {
      const body = await r.value.json().catch(() => ({}));
      errors.push(body.error?.message || `HTTP ${r.value.status}`);
    }
  }
  return { submitted, errors };
}

export async function submitSitemapToGSC(serviceAccountJson: string, siteUrl: string, sitemapUrl: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sa: ServiceAccount = JSON.parse(serviceAccountJson);
    const token = await getGoogleAccessToken(sa, "https://www.googleapis.com/auth/webmasters");
    const encodedSite = encodeURIComponent(siteUrl);
    const encodedSitemap = encodeURIComponent(sitemapUrl);
    const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodedSitemap}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
