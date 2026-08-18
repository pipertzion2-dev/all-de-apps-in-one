import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { isOrbitAiConfigured, orbitOpenai } from "@/lib/llm/openai";
import { getMarketingModel } from "@/lib/orbit/ai-client";

function formatFallback(items: string[]): string {
  if (!items.length) return "";
  const lines = ["### Your manual checklist\n"];
  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item}`);
  });
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  let items: string[] = [];
  try {
    if (!(await isOrbitAdminAllowed(req)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const raw = body.items as string[] | undefined;
    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json({ guide: "", empty: true, usedAi: false });
    }

    items = [...new Set(raw.map((s) => String(s).trim()).filter(Boolean))];
    const fallback = formatFallback(items);

    if (!isOrbitAiConfigured()) {
      return NextResponse.json({
        guide: fallback,
        usedAi: false,
        hint: "Add OPENAI_API_KEY (paid) or GEMINI_API_KEY for a shorter AI-condensed guide.",
      });
    }

    const userContent = items.map((t) => `• ${t}`).join("\n");

    const completion = await orbitOpenai.chat.completions.create({
      model: getMarketingModel(),
      messages: [
        {
          role: "system",
          content: `You help a busy founder finish SEO launch tasks after automation ran.
Rewrite the bullet list into ONE compact playbook:
1) Two short sentences: what matters most and in what order.
2) Numbered steps (merge duplicates), plain English, no hype, under 320 words.
3) Call out Google Search Console vs social vs directories clearly.
Use markdown. No title line before the playbook.`,
        },
        { role: "user", content: userContent },
      ],
      max_tokens: 900,
      temperature: 0.35,
    });

    const guide = completion.choices[0]?.message?.content?.trim() || fallback;
    return NextResponse.json({ guide, usedAi: true });
  } catch (e) {
    return NextResponse.json({
      guide: items.length ? formatFallback(items) : "",
      usedAi: false,
      error: String(e),
    });
  }
}
