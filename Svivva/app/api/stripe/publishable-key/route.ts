import { NextResponse } from "next/server";
import { getStripePublishableKey, hasCompleteStripeEnvKeys } from "@/lib/stripe/client";

export async function GET() {
  if (!hasCompleteStripeEnvKeys()) {
    return NextResponse.json({ publishableKey: null, configured: false });
  }

  try {
    const publishableKey = await getStripePublishableKey();
    return NextResponse.json({ publishableKey, configured: true });
  } catch (error) {
    console.error("Failed to get publishable key:", error);
    return NextResponse.json({ publishableKey: null, configured: false });
  }
}
