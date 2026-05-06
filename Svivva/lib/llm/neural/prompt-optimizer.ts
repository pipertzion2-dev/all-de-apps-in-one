import { openai, DEFAULT_MODEL } from "../openai";
import { type JsonSchema } from "@/lib/spec";

export interface PromptOptimizationResult {
  success: boolean;
  optimizedPrompt?: string;
  rationale?: string;
  improvementScore?: number;
  weaknesses?: string[];
  strengths?: string[];
  error?: string;
}

const OPTIMIZER_PROMPT = `You are a neural prompt optimization engine. Your job is to analyze AI API system prompts and produce an improved version that will generate higher quality, more consistent outputs.

Analyze the prompt for:
1. CLARITY: Is the instruction unambiguous? Are edge cases addressed?
2. SPECIFICITY: Does it define exact output expectations? Are constraints explicit?
3. ROBUSTNESS: Will it handle adversarial/unusual inputs gracefully?
4. SCHEMA ALIGNMENT: Does the prompt naturally guide toward the required output schema?
5. CONSISTENCY: Will different inputs produce consistently formatted outputs?
6. SAFETY: Does it prevent prompt injection and off-topic responses?

Return a JSON object with:
- optimizedPrompt: The improved system prompt (keep the same intent, improve quality)
- rationale: Detailed explanation of changes made and why
- improvementScore: 0-100 estimated improvement percentage
- weaknesses: Array of identified weaknesses in the original prompt
- strengths: Array of existing strengths to preserve`;

export async function optimizePrompt(
  systemPrompt: string,
  outputSchema: JsonSchema,
  trainingExamples?: { input: string; output: Record<string, unknown> }[]
): Promise<PromptOptimizationResult> {
  try {
    const examplesContext = trainingExamples && trainingExamples.length > 0
      ? `\n\nExisting training examples for context:\n${trainingExamples.slice(0, 3).map((e, i) => `Example ${i + 1}:\nInput: ${e.input}\nOutput: ${JSON.stringify(e.output)}`).join("\n\n")}`
      : "";

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: OPTIMIZER_PROMPT },
        {
          role: "user",
          content: `Optimize this system prompt for an AI API:

CURRENT SYSTEM PROMPT:
${systemPrompt}

OUTPUT SCHEMA (the prompt must guide toward this structure):
${JSON.stringify(outputSchema, null, 2)}
${examplesContext}

Return JSON with: optimizedPrompt, rationale, improvementScore (0-100), weaknesses (string[]), strengths (string[])`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from neural optimizer" };
    }

    const parsed = JSON.parse(content);
    return {
      success: true,
      optimizedPrompt: parsed.optimizedPrompt || parsed.optimized_prompt,
      rationale: parsed.rationale,
      improvementScore: parsed.improvementScore || parsed.improvement_score || 0,
      weaknesses: parsed.weaknesses || [],
      strengths: parsed.strengths || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
