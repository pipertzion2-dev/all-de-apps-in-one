import { NextResponse } from "next/server";
import { seedContent } from "@/lib/seed-content";

export async function POST() {
  try {
    await seedContent();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to seed content" }, { status: 500 });
  }
}
