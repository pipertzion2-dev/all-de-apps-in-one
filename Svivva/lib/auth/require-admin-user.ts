import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";
import { forbidden, unauthorized } from "@/lib/http-response";

export async function requireAdminUser() {
  if (await hasAdminAccess()) {
    const user = await getCurrentUser();
    return { user, error: null };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: unauthorized() };
  }

  return { user: null, error: forbidden() };
}
