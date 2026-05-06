import { executeRuntime, type RuntimeConfig } from "./runtime";
import { type JsonSchema } from "@/lib/spec";

export interface EvalCaseInput {
  id: string;
  name: string;
  input: string;
  expectedOutput: Record<string, unknown>;
  assertionType: string;
}

export interface EvalCaseResult {
  caseId: string;
  caseName: string;
  passed: boolean;
  actualOutput?: Record<string, unknown>;
  error?: string;
  latencyMs: number;
  score?: number;
  details?: {
    assertionType: string;
    matchedFields?: string[];
    mismatchedFields?: string[];
  };
}

export interface EvalRunResult {
  success: boolean;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  avgLatencyMs: number;
  results: EvalCaseResult[];
  error?: string;
}

function compareOutputs(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
  assertionType: string
): { passed: boolean; matchedFields: string[]; mismatchedFields: string[] } {
  const matchedFields: string[] = [];
  const mismatchedFields: string[] = [];

  const expectedWithoutMeta = { ...expected };
  delete expectedWithoutMeta._meta;

  switch (assertionType) {
    case "exact":
      for (const key of Object.keys(expectedWithoutMeta)) {
        if (JSON.stringify(actual[key]) === JSON.stringify(expectedWithoutMeta[key])) {
          matchedFields.push(key);
        } else {
          mismatchedFields.push(key);
        }
      }
      break;

    case "schema":
      for (const key of Object.keys(expectedWithoutMeta)) {
        if (actual[key] !== undefined && typeof actual[key] === typeof expectedWithoutMeta[key]) {
          matchedFields.push(key);
        } else {
          mismatchedFields.push(key);
        }
      }
      break;

    case "semantic":
    case "contains":
      for (const key of Object.keys(expectedWithoutMeta)) {
        if (actual[key] !== undefined) {
          matchedFields.push(key);
        } else {
          mismatchedFields.push(key);
        }
      }
      break;

    case "range":
      for (const key of Object.keys(expectedWithoutMeta)) {
        const expectedVal = expectedWithoutMeta[key];
        const actualVal = actual[key];
        if (typeof expectedVal === "number" && typeof actualVal === "number") {
          const tolerance = Math.abs(expectedVal) * 0.2;
          if (Math.abs(actualVal - expectedVal) <= tolerance) {
            matchedFields.push(key);
          } else {
            mismatchedFields.push(key);
          }
        } else if (actual[key] !== undefined) {
          matchedFields.push(key);
        } else {
          mismatchedFields.push(key);
        }
      }
      break;

    default:
      for (const key of Object.keys(expectedWithoutMeta)) {
        if (actual[key] !== undefined) {
          matchedFields.push(key);
        } else {
          mismatchedFields.push(key);
        }
      }
  }

  const totalFields = matchedFields.length + mismatchedFields.length;
  const passed = totalFields === 0 || matchedFields.length / totalFields >= 0.7;

  return { passed, matchedFields, mismatchedFields };
}

export async function runEvalCase(
  evalCase: EvalCaseInput,
  config: RuntimeConfig
): Promise<EvalCaseResult> {
  const startTime = Date.now();

  try {
    const result = await executeRuntime(evalCase.input, config);
    const latencyMs = Date.now() - startTime;

    if (!result.success || !result.output) {
      return {
        caseId: evalCase.id,
        caseName: evalCase.name,
        passed: false,
        error: result.error || "No output",
        latencyMs,
      };
    }

    const comparison = compareOutputs(
      result.output,
      evalCase.expectedOutput,
      evalCase.assertionType
    );

    const totalFields = comparison.matchedFields.length + comparison.mismatchedFields.length;
    const score = totalFields > 0 ? comparison.matchedFields.length / totalFields : 1;

    return {
      caseId: evalCase.id,
      caseName: evalCase.name,
      passed: comparison.passed,
      actualOutput: result.output,
      latencyMs,
      score,
      details: {
        assertionType: evalCase.assertionType,
        matchedFields: comparison.matchedFields,
        mismatchedFields: comparison.mismatchedFields,
      },
    };
  } catch (error) {
    return {
      caseId: evalCase.id,
      caseName: evalCase.name,
      passed: false,
      error: error instanceof Error ? error.message : "Unknown error",
      latencyMs: Date.now() - startTime,
    };
  }
}

export async function runEvalSuite(
  cases: EvalCaseInput[],
  config: RuntimeConfig,
  concurrency: number = 2
): Promise<EvalRunResult> {
  const results: EvalCaseResult[] = [];
  let totalLatency = 0;

  console.log(`[EvalRunner] Running ${cases.length} eval cases...`);

  for (let i = 0; i < cases.length; i += concurrency) {
    const batch = cases.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((c) => runEvalCase(c, config))
    );
    results.push(...batchResults);

    for (const r of batchResults) {
      totalLatency += r.latencyMs;
    }

    console.log(`[EvalRunner] Completed ${Math.min(i + concurrency, cases.length)}/${cases.length} cases`);
  }

  const passedCases = results.filter((r) => r.passed).length;
  const failedCases = results.filter((r) => !r.passed).length;

  return {
    success: true,
    totalCases: cases.length,
    passedCases,
    failedCases,
    passRate: cases.length > 0 ? passedCases / cases.length : 0,
    avgLatencyMs: cases.length > 0 ? totalLatency / cases.length : 0,
    results,
  };
}
