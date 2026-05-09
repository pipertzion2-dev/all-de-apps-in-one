import { createSign } from "crypto";

export interface GoogleServiceAccount {
  private_key: string;
  client_email: string;
  token_uri: string;
  project_id?: string;
}

function base64Url(input: string | Buffer): string {
  const buffer = typeof input === "string" ? Buffer.from(input) : input;
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function parseGoogleServiceAccount(rawJson: string): GoogleServiceAccount {
  const parsed = JSON.parse(rawJson) as GoogleServiceAccount;

  if (!parsed.private_key || !parsed.client_email || !parsed.token_uri) {
    throw new Error("Service account JSON missing private_key, client_email, or token_uri");
  }

  return parsed;
}

export async function getGoogleServiceAccountAccessToken(
  serviceAccount: GoogleServiceAccount,
  scope: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope,
      aud: serviceAccount.token_uri,
      exp: now + 3600,
      iat: now,
    }),
  );
  const sigInput = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(sigInput);
  const signature = base64Url(signer.sign(serviceAccount.private_key));
  const assertion = `${sigInput}.${signature}`;

  const response = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${assertion}`,
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token: ${response.status} - ${text.slice(0, 200)}`);
  }

  const json = await response.json();
  return json.access_token;
}
