import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null, isAdmin: false });
  return NextResponse.json({
    user: { id: user.id, email: user.email, firstName: user.firstName },
    isAdmin: isAdmin(user),
  });
}
