import { NextResponse } from "next/server";
import { getStripePublishableKey } from "@/lib/stripe/client";

export async function GET() {
  try {
    const publishableKey = await getStripePublishableKey();
    return NextResponse.json({ publishableKey });
  } catch (error: any) {
    console.error("Failed to get publishable key:", error);
    return NextResponse.json({ error: "Failed to load payment configuration" }, { status: 500 });
  }
}
