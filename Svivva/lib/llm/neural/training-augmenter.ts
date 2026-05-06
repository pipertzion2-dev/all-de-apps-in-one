import { openai, DEFAULT_MODEL } from "../openai";
import { type JsonSchema } from "@/lib/spec";

export interface AugmentedExample {
  input: string;
  output: Record<string, unknown>;
  strategy: string;
  qualityScore: number;
  approved: boolean;
}

export interface AugmentationResult {
  success: boolean;
  examples?: AugmentedExample[];
  generatedCount?: number;
  approvedCount?: number;
  error?: string;
}

const AUGMENTATION_STRATEGIES = {
  paraphrase: "Generate semantically equivalent inputs with different wording, style, and structure. Vary formality, sentence length, and vocabulary while preserving meaning.",
  adversarial: "Generate challenging inputs designed to test edge cases: ambiguous requests, borderline valid inputs, unusual formatting, mixed languages, and potential prompt injection attempts.",
  interpolation: "Generate inputs that fill gaps between existing examples. Find intermediate complexity levels, combine aspects of different examples, and explore unexplored input patterns.",
  diversity: "Generate inputs from underrepresented categories. Include different domains, user personas, input lengths, cultural contexts, and unusual but valid use cases.",
  stress: "Generate extreme inputs: very long text, minimal text, special characters, numbers, URLs, code snippets, and other unusual input types that the API should handle gracefully.",
};

const AUGMENTER_PROMPT = `You are a neural training data augmentation engine. Generate high-quality synthetic training examples for AI APIs using advanced augmentation strategies.

Each generated example must:
1. Have a realistic, meaningful input
2. Have an output that exactly matches the required JSON Schema
3. Be scored for quality (0-100)
4. Only be approved if score >= 75

Return JSON with "examples" array. Each example: { input, output (matching schema), strategy (which augmentation strategy was used), qualityScore (0-100), approved (boolean, true if qualityScore >= 75) }`;

export async function augmentTrainingData(
  systemPrompt: string,
  outputSchema: JsonSchema,
  strategy: keyof typeof AUGMENTATION_STRATEGIES,
  count: number = 10,
  existingExamples?: { input: string; output: Record<string, unknown> }[]
): Promise<AugmentationResult> {
  try {
    const strategyDescription = AUGMENTATION_STRATEGIES[strategy] || AUGMENTATION_STRATEGIES.diversity;
    
    const existingContext = existingExamples && existingExamples.length > 0
      ? `\n\nExisting examples (generate DIFFERENT ones):\n${existingExamples.slice(0, 5).map((e, i) => `${i + 1}. Input: "${e.input.substring(0, 100)}"`).join("\n")}`
      : "";

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: AUGMENTER_PROMPT },
        {
          role: "user",
          content: `Generate ${count} augmented training examples using the "${strategy}" strategy.

STRATEGY: ${strategyDescription}

API SYSTEM PROMPT:
${systemPrompt.substring(0, 2000)}

OUTPUT SCHEMA:
${JSON.stringify(outputSchema, null, 2)}
${existingContext}

Return JSON with "examples" array of ${count} items. Each: { input (string), output (object matching schema), strategy ("${strategy}"), qualityScore (0-100), approved (boolean) }`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 16384,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from augmentation engine" };
    }

    const parsed = JSON.parse(content);
    const examples: AugmentedExample[] = (parsed.examples || []).map((e: Partial<AugmentedExample>) => ({
      input: e.input || "",
      output: e.output || {},
      strategy: e.strategy || strategy,
      qualityScore: e.qualityScore ?? 0,
      approved: (e.qualityScore ?? 0) >= 75,
    }));

    const approved = examples.filter(e => e.approved);

    return {
      success: true,
      examples,
      generatedCount: examples.length,
      approvedCount: approved.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const STRATEGIES = Object.keys(AUGMENTATION_STRATEGIES) as (keyof typeof AUGMENTATION_STRATEGIES)[];
