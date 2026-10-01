import { validateOutput, type JsonSchema } from "@/lib/spec";
import type {
  GuardrailFinding,
  GuardrailFindingKey,
  GuardrailScanResult,
  GuardrailsAssessment,
  GuardrailSeverity,
} from "./types";

const SEVERITY: Record<string, GuardrailSeverity> = {
  high: "high",
  medium: "medium",
  low: "low",
};

const INJECTION_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|above|prior)\s+instructions?\b/i,
  /\bdisregard\s+(all\s+)?(previous|above)\s+instructions?\b/i,
  /\byou\s+are\s+now\s+/i,
  /\bfrom\s+now\s+on\s+you\s+/i,
  /\bnew\s+instructions?\s*:/i,
  /\boverride\s+(your\s+)?(system\s+)?prompt\b/i,
  /\bpretend\s+you\s+are\b/i,
  /\bact\s+as\s+if\s+you\s+have\s+no\s+restrictions\b/i,
  /\b\[system\]\s*:/i,
];

const SENSITIVE_PATTERNS = [
  /\b(?:sk|api[_-]?key)[-\w]{20,}/i,
  /\bBearer\s+[a-zA-Z0-9\-_.]{20,}/i,
  /\b[A-Za-z0-9_-]{32,}\s*(?:api[_-]?key|secret|token)/i,
  /\b\d{3}-\d{2}-\d{4}\b/,
];

function scoreFindings(findings: GuardrailFinding[]): number {
  const highCount = findings.filter((f) => f.severity === SEVERITY.high).length;
  const medCount = findings.filter((f) => f.severity === SEVERITY.medium).length;
  const lowCount = findings.filter((f) => f.severity === SEVERITY.low).length;
  const deduct = highCount * 25 + medCount * 10 + lowCount * 5;
  return Math.max(0, Math.min(100, 100 - deduct));
}

function pushFinding(
  findings: GuardrailFinding[],
  finding: Omit<GuardrailFinding, "key"> & { key: GuardrailFindingKey },
) {
  findings.push(finding);
}

export function analyzePromptHazards(systemPrompt: string): GuardrailScanResult {
  const findings: GuardrailFinding[] = [];
  const text = systemPrompt?.trim() ?? "";

  if (!text) {
    pushFinding(findings, {
      severity: "medium",
      category: "Prompt",
      message: "System prompt is empty — define behavior before deploy.",
      key: "missing_guardrails",
    });
    return { score: scoreFindings(findings), findings };
  }

  for (const re of INJECTION_PATTERNS) {
    if (re.test(text)) {
      pushFinding(findings, {
        severity: "high",
        category: "Injection risk",
        message: "Prompt matches common injection or role-override phrasing.",
        key: "injection_override",
      });
      break;
    }
  }

  for (const re of SENSITIVE_PATTERNS) {
    if (re.test(text)) {
      pushFinding(findings, {
        severity: "high",
        category: "Sensitive data",
        message: "Possible API key, token, or PII in the system prompt.",
        key: "sensitive_data",
      });
      break;
    }
  }

  if (/\b(?:do\s+anything|no\s+restrictions?|without\s+limits?)\b/i.test(text)) {
    pushFinding(findings, {
      severity: "medium",
      category: "Overly permissive",
      message: "Instructions may be too broad and increase misuse risk.",
      key: "overly_permissive",
    });
  }

  if (text.length > 200 && !/\b(?:must\s+not|do\s+not|never\s+|avoid\s+|forbidden)\b/i.test(text)) {
    pushFinding(findings, {
      severity: "low",
      category: "Guardrails",
      message: 'No explicit "must not" or "never" boundaries detected.',
      key: "missing_guardrails",
    });
  }

  if (!/\b(?:json|schema|output\s+format)\b/i.test(text) && text.length > 100) {
    pushFinding(findings, {
      severity: "low",
      category: "Output format",
      message: "No output format or structure constraint mentioned in the prompt.",
      key: "no_output_constraint",
    });
  }

  return { score: scoreFindings(findings), findings };
}

export function analyzeOutputSchemaHazards(outputSchema: Record<string, unknown>): GuardrailScanResult {
  const findings: GuardrailFinding[] = [];
  const keys = Object.keys(outputSchema ?? {});

  if (keys.length === 0) {
    pushFinding(findings, {
      severity: "high",
      category: "Schema",
      message: "Output schema is empty — Signal cannot enforce JSON on responses.",
      key: "empty_schema",
    });
    return { score: scoreFindings(findings), findings };
  }

  const str = JSON.stringify(outputSchema);
  for (const re of SENSITIVE_PATTERNS) {
    if (re.test(str)) {
      pushFinding(findings, {
        severity: "high",
        category: "Sensitive data",
        message: "Possible secret or PII embedded in the output schema.",
        key: "sensitive_data",
      });
      break;
    }
  }

  const schemaProbe = validateOutput({}, outputSchema as JsonSchema);
  if (
    !schemaProbe.valid &&
    schemaProbe.errors?.some(
      (e) =>
        /unknown validation|must be object|schema is invalid|no schema with key/i.test(e) ||
        e.startsWith("root:"),
    )
  ) {
    pushFinding(findings, {
      severity: "medium",
      category: "Schema",
      message: schemaProbe.errors.join("; ") || "Output schema failed to compile.",
      key: "invalid_schema",
    });
  }

  if (!/\b(?:required|properties|type)\b/i.test(str)) {
    pushFinding(findings, {
      severity: "low",
      category: "Schema",
      message: "Schema may lack required fields or types for strict validation.",
      key: "schema_security",
    });
  }

  return { score: scoreFindings(findings), findings };
}

/** Sneak Vision — static hazard preview before deploy (prompt + schema). */
export function assessGuardrails(input: {
  systemPrompt: string;
  outputSchema: Record<string, unknown>;
}): GuardrailsAssessment {
  const prompt = analyzePromptHazards(input.systemPrompt);
  const schema = analyzeOutputSchemaHazards(input.outputSchema);
  const hazards = [...prompt.findings, ...schema.findings];
  const blockers = hazards.filter((h) => h.severity === "high");
  const score = Math.round((prompt.score + schema.score) / 2);
  const schemaEnforced =
    Object.keys(input.outputSchema ?? {}).length > 0 &&
    !blockers.some((b) => b.key === "empty_schema" || b.key === "invalid_schema");

  return {
    ready: blockers.length === 0,
    score,
    prompt,
    schema,
    hazards,
    blockers,
    schemaEnforced,
  };
}
