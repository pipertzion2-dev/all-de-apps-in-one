import { SessionUser } from "./session";

function parseAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_ID?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Production builds must not treat every account as site admin when `ADMIN_USER_ID` is missing. */
function allowOpenAdminWhenAdminUserIdUnset(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Site owner / operator (Orbit, Growth, marketing secrets, GSC, etc.).
 * Set `ADMIN_USER_ID` to your auth provider user id (e.g. Replit OIDC `sub`). Comma-separated allows multiple owners.
 *
 * - If `ADMIN_USER_ID` is set: only those ids are admins.
 * - If unset in **development**: any signed-in user is treated as admin (local convenience).
 * - If unset in **production**: no one is admin until you configure `ADMIN_USER_ID`.
 */
export function isAdmin(user: SessionUser | null): boolean {
  if (!user) return false;
  const adminIds = parseAdminUserIds();
  if (adminIds.length > 0) {
    return adminIds.includes(user.id);
  }
  return allowOpenAdminWhenAdminUserIdUnset();
}

export function requireAdmin(user: SessionUser | null): boolean {
  return isAdmin(user);
}

/** First id in `ADMIN_USER_ID` — use for cron/internal jobs that should match the paying owner's `seed_credentials` row. */
export function getPrimaryAdminUserId(): string | null {
  const ids = parseAdminUserIds();
  return ids[0] ?? null;
}
