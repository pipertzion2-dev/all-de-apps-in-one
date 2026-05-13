import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { marketingAmplifyJobs } from "@/lib/marketing/schema";
import { desc } from "drizzle-orm";

const CHANNEL_PROMPTS: Record<string, string> = {
  twitter: "Rewrite the following content as a punchy Twitter/X thread (5-7 tweets). Start with a hook. Use short sentences. End with a CTA. No hashtag spam.",
  linkedin: "Rewrite the following content as a professional LinkedIn post. Lead with an insight. Use short paragraphs. Include a thoughtful CTA.",
  email: "Rewrite the following content as a marketing email. Include: Subject line, preview text, body (2-3 paragraphs), and a clear CTA button label.",
  instagram: "Rewrite the following content as an Instagram caption. Conversational, visual-first, 150-200 words. End with 5-10 relevant hashtags.",
  facebook: "Rewrite the following content as a Facebook post. Conversational, community-focused. Include a question to drive engagement.",
};

export async function GET() {
  try {
    const jobs = await db.select().from(marketingAmplifyJobs).orderBy(desc(marketingAmplifyJobs.createdAt)).limit(50);
    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceContent, channels = ["twitter", "linkedin", "email"], sourceType = "custom", sourceId } = body;
    if (!sourceContent || !sourceContent.trim()) {
      return NextResponse.json({ error: "sourceContent is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1";

    const outputs: Array<{ channel: string; content: string; status: string }> = [];

    for (const channel of channels) {
      const prompt = CHANNEL_PROMPTS[channel] ?? "Rewrite this content for marketing purposes.";
      try {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: prompt },
              { role: "user", content: sourceContent },
            ],
            max_tokens: 800,
          }),
        });
        if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
        const data = await res.json();
        outputs.push({ channel, content: data.choices[0].message.content, status: "done" });
      } catch {
        outputs.push({ channel, content: "", status: "failed" });
      }
    }

    const [job] = await db
      .insert(marketingAmplifyJobs)
      .values({ sourceContent, sourceType, sourceId, channels, outputs, status: "done" })
      .returning();

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to amplify content" }, { status: 500 });
  }
}
