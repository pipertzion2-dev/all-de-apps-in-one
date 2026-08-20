/** Reject Vercel/.env placeholder OAuth values so DB-saved credentials can hydrate. */

const PLACEHOLDER_CLIENT_ID =
  /your-client-id|placeholder|changeme|example|xxx+|replace-?me|insert-?here|todo|fake|dummy|test-client/i;
const PLACEHOLDER_SECRET =
  /your-client-secret|placeholder|changeme|example|xxx+|replace-?me|insert-?here|todo|fake|dummy/i;

export function isValidGscOAuthClientId(value: string | null | undefined): boolean {
  const id = value?.trim() || "";
  if (!id) return false;
  if (PLACEHOLDER_CLIENT_ID.test(id)) return false;
  return /^[\w-]+\.apps\.googleusercontent\.com$/i.test(id);
}

export function isValidGscOAuthClientSecret(value: string | null | undefined): boolean {
  const secret = value?.trim() || "";
  if (!secret || secret.length < 8) return false;
  if (PLACEHOLDER_SECRET.test(secret)) return false;
  return true;
}

export function isValidGscOAuthCredentials(
  clientId: string | null | undefined,
  clientSecret: string | null | undefined,
): boolean {
  return isValidGscOAuthClientId(clientId) && isValidGscOAuthClientSecret(clientSecret);
}

/** Human-readable reason when credentials are present but invalid (e.g. Vercel placeholder). */
export function gscOAuthConfigProblem(
  clientId: string | null | undefined,
  clientSecret: string | null | undefined,
): string | null {
  const id = clientId?.trim() || "";
  const secret = clientSecret?.trim() || "";
  if (!id && !secret) return null;
  if (id && !isValidGscOAuthClientId(id)) {
    if (PLACEHOLDER_CLIENT_ID.test(id)) {
      return "Google OAuth client ID in Vercel is still a placeholder — paste real credentials on the GSC connect page or update Vercel env vars.";
    }
    return "Google OAuth client ID is invalid — it must end with .apps.googleusercontent.com";
  }
  if (secret && !isValidGscOAuthClientSecret(secret)) {
    return "Google OAuth client secret is missing or still a placeholder.";
  }
  if (isValidGscOAuthClientId(id) && !secret) {
    return "Google OAuth client secret is missing.";
  }
  if (isValidGscOAuthClientSecret(secret) && !id) {
    return "Google OAuth client ID is missing.";
  }
  return null;
}
