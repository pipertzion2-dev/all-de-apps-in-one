import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { getPrimaryAdminUserId, hasAdminAccess } from "@/lib/auth/admin";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { forbidden, unauthorized } from "@/lib/http-response";

/** Synthetic admin user when passcode 272727 is set but no auth session exists. */
async function adminFallbackUser(): Promise<SessionUser> {
  const id = getPrimaryAdminUserId() || (await resolveOrbitInternalUserId()) || "orbit-admin";
  return {
    id,
    email: null,
    firstName: "Admin",
    lastName: null,
    profileImageUrl: null,
  };
}

export async function requireAdminUser(): Promise<{
  user: SessionUser | null;
  error: ReturnType<typeof unauthorized> | ReturnType<typeof forbidden> | null;
}> {
  if (await hasAdminAccess()) {
    const user = await getCurrentUser();
    return { user: user ?? (await adminFallbackUser()), error: null };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: unauthorized() };
  }

  return { user: null, error: forbidden() };
}
