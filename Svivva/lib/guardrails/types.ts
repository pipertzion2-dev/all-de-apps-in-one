export type GuardrailSeverity = "high" | "medium" | "low";

export type GuardrailFindingKey =
  | "injection_override"
  | "sensitive_data"
  | "overly_permissive"
  | "missing_guardrails"
  | "schema_security"
  | "no_output_constraint"
  | "empty_schema"
  | "invalid_schema";

export interface GuardrailFinding {
  severity: GuardrailSeverity;
  category: string;
  message: string;
  key: GuardrailFindingKey;
}

export interface GuardrailScanResult {
  score: number;
  findings: GuardrailFinding[];
}

export interface GuardrailsAssessment {
  ready: boolean;
  score: number;
  prompt: GuardrailScanResult;
  schema: GuardrailScanResult;
  hazards: GuardrailFinding[];
  blockers: GuardrailFinding[];
  schemaEnforced: boolean;
}
