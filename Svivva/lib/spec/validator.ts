import Ajv from "ajv";
import { ProjectSpecSchema, type ProjectSpec, type JsonSchema } from "./types";
import { z } from "zod";

const ajv = new Ajv({ allErrors: true, strict: false });

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  data?: ProjectSpec;
}

export interface OutputValidationResult {
  valid: boolean;
  errors?: string[];
  data?: Record<string, unknown>;
}

export function validateProjectSpec(input: unknown): ValidationResult {
  const result = ProjectSpecSchema.safeParse(input);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
  }

  return {
    valid: true,
    data: result.data,
  };
}

export function validateOutput(output: unknown, schema: JsonSchema): OutputValidationResult {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(output);

    if (!valid) {
      return {
        valid: false,
        errors: validate.errors?.map((e) => `${e.instancePath || "root"}: ${e.message}`),
      };
    }

    return {
      valid: true,
      data: output as Record<string, unknown>,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : "Unknown validation error"],
    };
  }
}

export function validateOutputStrict(output: unknown, schema: JsonSchema): Record<string, unknown> {
  const result = validateOutput(output, schema);

  if (!result.valid) {
    throw new Error(`Output validation failed: ${result.errors?.join(", ")}`);
  }

  return result.data!;
}

export function parseProjectSpec(input: unknown): ProjectSpec {
  return ProjectSpecSchema.parse(input);
}

export function safeParseProjectSpec(input: unknown): ValidationResult {
  return validateProjectSpec(input);
}
