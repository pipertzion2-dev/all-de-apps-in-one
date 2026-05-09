import { openai, DEFAULT_MODEL } from "../openai";

export interface FailureRecord {
  input: string;
  error?: string;
  output?: Record<string, unknown>;
  latencyMs?: number;
  timestamp?: string;
}

export interface DetectedAnomaly {
  signalType: string;
  severity: string;
  title: string;
  description: string;
  pattern: Record<string, unknown>;
  recommendations: string[];
}

export interface AnomalyDetectionResult {
  success: boolean;
  anomalies?: DetectedAnomaly[];
  summary?: string;
  error?: string;
}

const DETECTOR_PROMPT = `You are a neural anomaly detection engine for AI APIs. Analyze failure records and API execution data to identify patterns, recurring issues, and systemic problems.

Detect these types of anomalies:

SIGNAL TYPES:
- "recurring_failure": Same type of error happening repeatedly
- "performance_degradation": Increasing latency or response times
- "schema_drift": Outputs gradually deviating from expected schema
- "input_pattern": Specific input patterns consistently causing failures
- "quality_regression": Output quality decreasing over time
- "edge_case_cluster": Multiple related edge cases being discovered
- "prompt_weakness": Systematic weaknesses in prompt handling

SEVERITY LEVELS:
- "critical": Affecting >50% of requests or causing data loss
- "high": Affecting 20-50% of requests or producing wrong results
- "medium": Affecting 5-20% of requests or causing inconsistencies
- "low": Minor issues affecting <5% of requests

For each anomaly provide:
- signalType: One of the types above
- severity: critical/high/medium/low
- title: Short descriptive title
- description: Detailed explanation of the pattern
- pattern: JSON object with relevant data points
- recommendations: Array of actionable fix suggestions

Return JSON with "anomalies" array and "summary" string.`;

export async function detectAnomalies(
  failures: FailureRecord[],
  systemPrompt: string,
  projectName: string,
): Promise<AnomalyDetectionResult> {
  try {
    if (failures.length === 0) {
      return {
        success: true,
        anomalies: [],
        summary: "No failure records to analyze",
      };
    }

    const failuresSummary = failures.slice(0, 50).map((f, i) => ({
      index: i + 1,
      input: f.input.substring(0, 200),
      error: f.error?.substring(0, 200),
      hasOutput: !!f.output,
      latencyMs: f.latencyMs,
    }));

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: DETECTOR_PROMPT },
        {
          role: "user",
          content: `Analyze these ${failures.length} failure/issue records for API "${projectName}":

API PURPOSE: ${systemPrompt.substring(0, 1000)}

FAILURE RECORDS:
${JSON.stringify(failuresSummary, null, 2)}

Identify patterns, recurring issues, and anomalies. Return JSON with "anomalies" array and "summary" string.`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from anomaly detector" };
    }

    const parsed = JSON.parse(content);
    const anomalies: DetectedAnomaly[] = (parsed.anomalies || []).map(
      (a: Partial<DetectedAnomaly>) => ({
        signalType: a.signalType || a.signalType || "recurring_failure",
        severity: a.severity || "medium",
        title: a.title || "Unknown anomaly",
        description: a.description || "",
        pattern: a.pattern || {},
        recommendations: a.recommendations || [],
      }),
    );

    return {
      success: true,
      anomalies,
      summary: parsed.summary || `Detected ${anomalies.length} anomalies`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
