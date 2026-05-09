import { openai, DEFAULT_MODEL } from "../openai";
import { type JsonSchema } from "@/lib/spec";

export interface QualityGateResult {
  success: boolean;
  confidenceScore?: number;
  coherenceScore?: number;
  completenessScore?: number;
  flags?: string[];
  explanation?: string;
  error?: string;
}

const QUALITY_GATE_PROMPT = `You are a neural quality gate for AI API outputs. Score the quality of an API response on multiple dimensions.

Evaluate:
1. CONFIDENCE (0-100): How confident are you that this output correctly addresses the input? Consider relevance, accuracy, and appropriateness.
2. COHERENCE (0-100): Is the output internally consistent? Are there contradictions, nonsensical values, or illogical combinations?
3. COMPLETENESS (0-100): Does the output fully address the input? Are all required fields populated with meaningful values (not just defaults/placeholders)?

Flag issues like:
- "hallucination_risk": Output contains claims that seem fabricated or unsupported
- "low_effort": Output appears to use generic/template responses
- "schema_mismatch": Output structure doesn't align well with intent
- "inconsistent_values": Field values contradict each other
- "truncated": Output appears cut off or incomplete
- "bias_detected": Output shows potential bias
- "safety_concern": Output may contain harmful content

Return JSON with: confidenceScore, coherenceScore, completenessScore (all 0-100 integers), flags (string array, empty if no issues), explanation (brief quality assessment)`;

export async function scoreOutputQuality(
  input: string,
  output: Record<string, unknown>,
  outputSchema: JsonSchema,
  systemPrompt: string,
): Promise<QualityGateResult> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: QUALITY_GATE_PROMPT },
        {
          role: "user",
          content: `Score this AI API output:

USER INPUT: ${input}

API OUTPUT: ${JSON.stringify(output, null, 2)}

EXPECTED SCHEMA: ${JSON.stringify(outputSchema, null, 2)}

API PURPOSE: ${systemPrompt.substring(0, 1000)}

Return JSON: confidenceScore (0-100), coherenceScore (0-100), completenessScore (0-100), flags (string[]), explanation (string)`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from quality gate" };
    }

    const parsed = JSON.parse(content);
    return {
      success: true,
      confidenceScore: Math.round(parsed.confidenceScore ?? parsed.confidence_score ?? 0),
      coherenceScore: Math.round(parsed.coherenceScore ?? parsed.coherence_score ?? 0),
      completenessScore: Math.round(parsed.completenessScore ?? parsed.completeness_score ?? 0),
      flags: parsed.flags || [],
      explanation: parsed.explanation || "",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
