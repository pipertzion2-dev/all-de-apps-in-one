import { NextRequest, NextResponse } from "next/server";
import { WebhookHandlers } from "@/lib/stripe/webhook";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature");
    
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }
    
    const body = await request.arrayBuffer();
    const payload = Buffer.from(body);
    
    await WebhookHandlers.processWebhook(payload, signature);
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 400 });
  }
}
