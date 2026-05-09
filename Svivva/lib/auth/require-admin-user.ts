import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { forbidden, unauthorized } from "@/lib/http-response";

export async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: unauthorized() };
  }

  if (!isAdmin(user)) {
    return { user: null, error: forbidden() };
  }

  return { user, error: null };
}
