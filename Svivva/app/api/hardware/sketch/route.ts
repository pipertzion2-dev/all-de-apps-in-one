import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/llm/openai";
import { getSession } from "@/lib/auth/session";

const ALLOWED_SIZES = new Set(["1024x1024", "1792x1024", "1024x1792"]);

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Sign in to generate sketches." }, { status: 401 });
    }

    const body = await req.json();
    const prompt = String(body?.prompt ?? "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "Enter a prompt." }, { status: 400 });
    }
    if (prompt.length > 4000) {
      return NextResponse.json({ error: "Prompt is too long (max 4000 chars)." }, { status: 400 });
    }

    const size = ALLOWED_SIZES.has(body?.size) ? body.size : "1024x1024";
    const quality = body?.quality === "hd" ? "hd" : "standard";

    const out = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: size as "1024x1024" | "1792x1024" | "1024x1792",
      quality: quality as "standard" | "hd",
      response_format: "b64_json",
    });

    const b64 = out.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "No image data returned from model." }, { status: 502 });
    }

    return NextResponse.json({
      imageBase64: b64,
      mimeType: "image/png",
      revisedPrompt: out.data?.[0]?.revised_prompt || null,
    });
  } catch (err: unknown) {
    console.error("[hardware/sketch]", err);
    return NextResponse.json({ error: "Image generation failed." }, { status: 502 });
  }
}
