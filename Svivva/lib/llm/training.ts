import { openai, DEFAULT_MODEL } from "./openai";
import { type JsonSchema } from "@/lib/spec";

export interface TrainingExample {
  input: string;
  output: Record<string, unknown>;
  description?: string;
}

export interface GradedExample extends TrainingExample {
  score: number;
  feedback: string;
  approved: boolean;
}

export interface GenerateTrainingResult {
  success: boolean;
  examples?: GradedExample[];
  approved?: GradedExample[];
  rejected?: GradedExample[];
  error?: string;
}

const GENERATE_PROMPT = `You are an expert at creating training examples for AI APIs.

Given a system prompt and output schema, generate diverse, realistic training examples that cover:
1. Common use cases (happy path)
2. Edge cases (unusual inputs)
3. Boundary conditions
4. Different input styles and lengths

Each example should have:
- input: A realistic user input string
- output: The expected JSON output matching the schema exactly
- description: Brief explanation of what this example tests

Generate high-quality, diverse examples that would help train a model to handle real-world inputs.`;

const GRADER_PROMPT = `You are a strict quality grader for AI training examples.

Evaluate each training example based on:
1. Correctness (0-25): Does the output match what should be produced for the input?
2. Schema compliance (0-25): Does the output exactly match the required schema?
3. Realism (0-25): Is the input realistic and useful for training?
4. Diversity (0-25): Does it add unique value compared to typical examples?

Return a score from 0-100 and whether to approve (score >= 70).
Be strict - only approve high-quality examples.`;

export async function generateTrainingExamples(
  systemPrompt: string,
  outputSchema: JsonSchema,
  count: number = 5,
): Promise<TrainingExample[]> {
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: "system", content: GENERATE_PROMPT },
      {
        role: "user",
        content: `Generate ${count} diverse training examples for this API:

System Prompt:
${systemPrompt}

Output Schema:
${JSON.stringify(outputSchema, null, 2)}

Return a JSON object with an "examples" array containing ${count} examples.
Each example must have: input (string), output (object matching schema), description (string).`,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from LLM");
  }

  const parsed = JSON.parse(content);
  return parsed.examples || [];
}

export async function gradeTrainingExample(
  example: TrainingExample,
  systemPrompt: string,
  outputSchema: JsonSchema,
): Promise<GradedExample> {
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: "system", content: GRADER_PROMPT },
      {
        role: "user",
        content: `Grade this training example:

Input: ${example.input}

Output: ${JSON.stringify(example.output, null, 2)}

Description: ${example.description || "N/A"}

Expected to follow this schema:
${JSON.stringify(outputSchema, null, 2)}

For an API with this system prompt:
${systemPrompt.substring(0, 500)}...

Return JSON with: score (0-100), feedback (string explaining the grade), approved (boolean, true if score >= 70)`,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      ...example,
      score: 0,
      feedback: "Grading failed - no response",
      approved: false,
    };
  }

  const grade = JSON.parse(content);
  return {
    ...example,
    score: grade.score || 0,
    feedback: grade.feedback || "No feedback",
    approved: grade.approved ?? grade.score >= 70,
  };
}

export async function generateAndGradeTraining(
  systemPrompt: string,
  outputSchema: JsonSchema,
  count: number = 5,
  minApproved: number = 3,
): Promise<GenerateTrainingResult> {
  try {
    const requestCount = Math.max(count, minApproved + 2);

    console.log(`[Training] Generating ${requestCount} training examples...`);
    const examples = await generateTrainingExamples(systemPrompt, outputSchema, requestCount);

    console.log(`[Training] Generated ${examples.length} examples, grading...`);

    const graded: GradedExample[] = [];
    for (const example of examples) {
      const gradedExample = await gradeTrainingExample(example, systemPrompt, outputSchema);
      graded.push(gradedExample);
      console.log(
        `[Training] Example graded: score=${gradedExample.score}, approved=${gradedExample.approved}`,
      );
    }

    const approved = graded.filter((e) => e.approved).sort((a, b) => b.score - a.score);
    const rejected = graded.filter((e) => !e.approved);

    console.log(`[Training] Results: ${approved.length} approved, ${rejected.length} rejected`);

    return {
      success: true,
      examples: graded,
      approved,
      rejected,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
