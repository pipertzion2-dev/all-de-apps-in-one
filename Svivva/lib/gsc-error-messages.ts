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
    return "Google OAuth credentials are invalid or still placeholders in Vercel. Paste your real OAuth client ID + secret above, then try again.";
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
  if (code.length > 80 || code.includes("Error") || code.includes("error")) {
    return code.slice(0, 220);
  }
  return `Google sign-in failed: ${code}`;
}
