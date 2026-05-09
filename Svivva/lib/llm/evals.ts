import { openai, DEFAULT_MODEL } from "./openai";
import { type JsonSchema } from "@/lib/spec";

export interface EvalCase {
  name: string;
  input: string;
  expectedOutput: Record<string, unknown>;
  category: "happy_path" | "edge_case" | "adversarial" | "boundary" | "format" | "multilingual";
  assertionType: "exact" | "schema" | "semantic" | "contains" | "range";
  rubric?: {
    criteria: string[];
    weights: Record<string, number>;
    passingThreshold: number;
  };
  description?: string;
}

export interface GenerateEvalsResult {
  success: boolean;
  cases?: EvalCase[];
  error?: string;
  categoryCounts?: Record<string, number>;
}

const GENERATE_EVALS_PROMPT = `You are an expert QA engineer generating comprehensive eval test cases for AI APIs.

Generate diverse eval cases covering:

1. HAPPY PATH (40%): Common, expected use cases
   - Typical inputs users would send
   - Standard formatting and length

2. EDGE CASES (20%): Unusual but valid inputs
   - Very short inputs (1-2 words)
   - Very long inputs (multiple paragraphs)
   - Special characters, emojis, punctuation
   - Numbers, dates, currencies

3. ADVERSARIAL (15%): Attempts to break or confuse
   - Prompt injection attempts
   - Off-topic inputs
   - Contradictory statements
   - Gibberish or random text

4. BOUNDARY (10%): Testing limits
   - Empty-ish inputs (whitespace only)
   - Maximum length inputs
   - Minimum valid inputs

5. FORMAT VARIATIONS (10%): Different input styles
   - All caps, all lowercase
   - With/without punctuation
   - Formal vs informal language

6. MULTILINGUAL (5%): Non-English inputs
   - Spanish, French, German, Chinese, Japanese
   - Mixed language inputs

For each case provide:
- name: Short unique identifier
- input: The test input string
- expectedOutput: Expected JSON matching the schema
- category: One of the categories above
- assertionType: How to validate (exact, schema, semantic, contains, range)
- rubric: Scoring criteria with weights
- description: What this case tests`;

function generateBatchPrompt(
  systemPrompt: string,
  outputSchema: JsonSchema,
  batchNum: number,
  totalBatches: number,
  casesPerBatch: number,
  existingNames: Set<string>,
): string {
  const existingList =
    existingNames.size > 0
      ? `\n\nALREADY GENERATED (avoid duplicates): ${Array.from(existingNames).slice(-20).join(", ")}`
      : "";

  return `Generate ${casesPerBatch} unique eval test cases for this API (batch ${batchNum}/${totalBatches}).

API System Prompt:
${systemPrompt.substring(0, 2000)}

Output Schema:
${JSON.stringify(outputSchema, null, 2)}
${existingList}

Return JSON with "cases" array. Each case must have: name (unique), input, expectedOutput (matching schema), category, assertionType, rubric (with criteria array, weights object, passingThreshold), description.

Focus on ${getCategoryFocus(batchNum, totalBatches)} for this batch.`;
}

function getCategoryFocus(batchNum: number, totalBatches: number): string {
  const ratio = batchNum / totalBatches;
  if (ratio <= 0.4) return "HAPPY PATH cases - common, expected user inputs";
  if (ratio <= 0.6)
    return "EDGE CASES - unusual but valid inputs like short/long text, special characters";
  if (ratio <= 0.75) return "ADVERSARIAL cases - attempts to break or confuse the API";
  if (ratio <= 0.85) return "BOUNDARY cases - testing input limits and extremes";
  if (ratio <= 0.95) return "FORMAT VARIATIONS - different styles, caps, punctuation";
  return "MULTILINGUAL cases - non-English and mixed language inputs";
}

export async function generateEvalBatch(
  systemPrompt: string,
  outputSchema: JsonSchema,
  batchNum: number,
  totalBatches: number,
  casesPerBatch: number,
  existingNames: Set<string>,
): Promise<EvalCase[]> {
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: "system", content: GENERATE_EVALS_PROMPT },
      {
        role: "user",
        content: generateBatchPrompt(
          systemPrompt,
          outputSchema,
          batchNum,
          totalBatches,
          casesPerBatch,
          existingNames,
        ),
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 16384,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.error(`[Evals] Batch ${batchNum} returned no content`);
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    const cases = parsed.cases || [];

    return cases.map((c: Partial<EvalCase>) => ({
      name: c.name || `case_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      input: c.input || "",
      expectedOutput: c.expectedOutput || {},
      category: c.category || "happy_path",
      assertionType: c.assertionType || "schema",
      rubric: c.rubric || {
        criteria: ["schema_compliance", "correctness"],
        weights: { schema_compliance: 0.5, correctness: 0.5 },
        passingThreshold: 0.7,
      },
      description: c.description,
    }));
  } catch (e) {
    console.error(`[Evals] Failed to parse batch ${batchNum}:`, e);
    return [];
  }
}

export async function generateEvalCases(
  systemPrompt: string,
  outputSchema: JsonSchema,
  targetCount: number = 100,
): Promise<GenerateEvalsResult> {
  try {
    const casesPerBatch = 10;
    const totalBatches = Math.ceil(targetCount / casesPerBatch);
    const existingNames = new Set<string>();
    const allCases: EvalCase[] = [];

    console.log(`[Evals] Generating ${targetCount} cases in ${totalBatches} batches...`);

    for (let batch = 1; batch <= totalBatches; batch++) {
      console.log(`[Evals] Generating batch ${batch}/${totalBatches}...`);

      const cases = await generateEvalBatch(
        systemPrompt,
        outputSchema,
        batch,
        totalBatches,
        casesPerBatch,
        existingNames,
      );

      for (const c of cases) {
        if (!existingNames.has(c.name)) {
          existingNames.add(c.name);
          allCases.push(c);
        }
      }

      console.log(
        `[Evals] Batch ${batch} complete: ${cases.length} cases (total: ${allCases.length})`,
      );

      if (allCases.length >= targetCount) break;
    }

    const categoryCounts: Record<string, number> = {};
    for (const c of allCases) {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }

    console.log(`[Evals] Generation complete: ${allCases.length} total cases`);
    console.log(`[Evals] Category breakdown:`, categoryCounts);

    return {
      success: true,
      cases: allCases.slice(0, targetCount),
      categoryCounts,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
