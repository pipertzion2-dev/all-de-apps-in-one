/** Human-readable copy for GSC OAuth error codes (URL params + API responses). */
export function gscOAuthErrorMessage(err: string | null | undefined): string {
  if (!err?.trim()) return "Google sign-in failed.";
  const code = err.trim();
  if (code === "no_refresh_token") {
    return "Google did not return a refresh token. Revoke ZZAI at myaccount.google.com/permissions, then connect again.";
  }
  if (code === "admin_required") {
    return "Enter the admin passcode on this page first, then try again.";
  }
  if (code === "oauth_not_configured") {
    return "Google OAuth is not configured yet. Paste your OAuth client ID + secret on this page, or set GOOGLE_GSC_CLIENT_ID + GOOGLE_GSC_CLIENT_SECRET in Vercel.";
  }
  if (code === "oauth_invalid_client") {
    return "Google OAuth is not ready yet. Click Save OAuth client below first (admin passcode required). If Save fails, set DATABASE_URL in Vercel to hosted Postgres, or paste GOOGLE_GSC_CLIENT_ID + GOOGLE_GSC_CLIENT_SECRET in Vercel env vars and redeploy.";
  }
  if (code === "invalid_state") {
    return "Sign-in session expired — common on iPhone if Google opened outside Safari. Use alternate connect below (new tab + paste URL), or retry in Safari.";
  }
  if (code === "oauth_start_failed") {
    return "Could not start Google sign-in. Wait a moment and try again.";
  }
  if (code === "Forbidden") {
    return "Admin unlock required — enter the admin passcode on this page first.";
  }
  if (/did not match the expected pattern/i.test(code)) {
    return "Could not read the server reply (common in Safari). Unlock admin, refresh the page, and try save again.";
  }
  if (/econnrefused|connect refused|database connection failed/i.test(code)) {
    return "Database connection failed — Google signed in, but the app could not save your session. Set DATABASE_URL in Vercel to your hosted Postgres and redeploy.";
  }
  if (/database unavailable|could not save oauth client/i.test(code)) {
    return "Database unavailable — could not save OAuth credentials. Set DATABASE_URL in Vercel to hosted Postgres and redeploy, or set GOOGLE_GSC_CLIENT_ID + GOOGLE_GSC_CLIENT_SECRET in Vercel env vars.";
  }
  if (code.length > 80 || code.includes("Error") || code.includes("error")) {
    return code.slice(0, 220);
  }
  return `Google sign-in failed: ${code}`;
}
