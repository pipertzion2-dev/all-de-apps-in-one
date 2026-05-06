import { SessionUser } from "./session";

export function isAdmin(user: SessionUser | null): boolean {
  if (!user) return false;
  const adminId = process.env.ADMIN_USER_ID;
  if (!adminId) return true;
  return user.id === adminId;
}

export function requireAdmin(user: SessionUser | null): boolean {
  return isAdmin(user);
}
