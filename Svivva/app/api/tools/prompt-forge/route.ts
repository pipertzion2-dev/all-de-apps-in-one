import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/llm/openai";

const ALLOWED_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4o-2024-11-20", "gpt-4-turbo"] as const;
type AllowedModel = (typeof ALLOWED_MODELS)[number];

const rateLimitMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const limit = 12;
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + window });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit reached — 12 requests/minute. Upgrade to Svivva for unlimited." },
      { status: 429 },
    );
  }

  let body: { systemPrompt?: string; userMessage?: string; model?: string; temperature?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { systemPrompt = "", userMessage = "", model = "gpt-4o-mini", temperature = 0.7 } = body;

  if (!userMessage.trim()) {
    return NextResponse.json({ error: "User message is required" }, { status: 400 });
  }
  if (!ALLOWED_MODELS.includes(model as AllowedModel)) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }
  if (userMessage.length > 8000 || systemPrompt.length > 4000) {
    return NextResponse.json(
      { error: "Prompt too long — max 8000 chars for user message, 4000 for system prompt" },
      { status: 400 },
    );
  }

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (systemPrompt.trim()) messages.push({ role: "system", content: systemPrompt.trim() });
  messages.push({ role: "user", content: userMessage.trim() });

  const start = Date.now();
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: 1500,
    });

    const latencyMs = Date.now() - start;
    const choice = completion.choices[0];
    const usage = completion.usage;

    const MODEL_PRICES: Record<string, { input: number; output: number }> = {
      "gpt-4o-mini": { input: 0.15, output: 0.6 },
      "gpt-4o": { input: 2.5, output: 10.0 },
      "gpt-4o-2024-11-20": { input: 2.5, output: 10.0 },
      "gpt-4-turbo": { input: 10.0, output: 30.0 },
    };
    const prices = MODEL_PRICES[model] || MODEL_PRICES["gpt-4o-mini"];
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const costUsd = (inputTokens * prices.input + outputTokens * prices.output) / 1_000_000;

    return NextResponse.json({
      content: choice.message.content || "",
      inputTokens,
      outputTokens,
      totalTokens: usage?.total_tokens || 0,
      model,
      latencyMs,
      costUsd,
      finishReason: choice.finish_reason,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "OpenAI request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
