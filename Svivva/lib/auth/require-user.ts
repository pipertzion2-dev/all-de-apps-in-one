import { getCurrentUser } from "@/lib/auth/session";
import { unauthorized } from "@/lib/http-response";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: unauthorized() };
  }

  return { user, error: null };
}
