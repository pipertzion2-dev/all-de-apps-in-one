/**
 * Thin wrapper around the shared LLM client for orbit API routes.
 */
import { openai, getDefaultModel } from "@/lib/llm/openai";

export async function generateText(
  prompt: string,
  opts: { maxTokens?: number; systemPrompt?: string } = {},
): Promise<string> {
  const { maxTokens = 800, systemPrompt } = opts;
  const messages: { role: "system" | "user"; content: string }[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const res = await openai.chat.completions.create({
    model: getDefaultModel(),
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  });

  return res.choices[0]?.message?.content?.trim() ?? "";
}
