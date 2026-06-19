import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasAdminAccess()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { appName, appUrl, description } = await req.json();
    if (!appName) return NextResponse.json({ error: "appName required" }, { status: 400 });

    const prompt = `Generate social media launch content for this app:
Name: ${appName}
URL: ${appUrl || ""}
Description: ${description || appName}

Return a JSON object with these keys:
{
  "twitter": "Tweet under 280 chars with hashtags and URL",
  "linkedin": "Professional LinkedIn post 2-3 paragraphs",
  "reddit": "Reddit Show HN / r/webdev style post with title and body text (label them)",
  "producthunt": "Product Hunt tagline (under 60 chars) and description (under 260 chars), label each",
  "hackernews": "Show HN: title for Hacker News (under 80 chars)",
  "devto": "Dev.to article title and intro paragraph"
}

Keep it authentic, not overly salesy. Highlight what makes it useful.`;

    const resp = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 1200,
    });
    const raw = resp.choices[0]?.message?.content || "";
    const match = raw.match(/\{[\s\S]*\}/);
    const content = match ? JSON.parse(match[0]) : { twitter: raw };

    return NextResponse.json({ success: true, content });
  } catch (e) {
    console.error("social-content error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
