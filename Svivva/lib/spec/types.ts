import { z } from "zod";

// ============================================================================
// JSON SCHEMA TYPES (for output validation)
// ============================================================================

export const JsonSchemaTypeSchema = z.enum([
  "string",
  "number",
  "integer",
  "boolean",
  "array",
  "object",
  "null",
]);

export const JsonSchemaPropertySchema: z.ZodType<JsonSchemaProperty> = z.lazy(() =>
  z.object({
    type: JsonSchemaTypeSchema.or(z.array(JsonSchemaTypeSchema)).optional(),
    description: z.string().optional(),
    enum: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
    items: JsonSchemaPropertySchema.optional(),
    properties: z.record(JsonSchemaPropertySchema).optional(),
    required: z.array(z.string()).optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    minimum: z.number().optional(),
    maximum: z.number().optional(),
    pattern: z.string().optional(),
    format: z.string().optional(),
    default: z.unknown().optional(),
    examples: z.array(z.unknown()).optional(),
  }),
);

export const JsonSchemaSchema = z.object({
  type: z.literal("object"),
  properties: z.record(JsonSchemaPropertySchema),
  required: z.array(z.string()).optional(),
  additionalProperties: z.boolean().optional(),
});

// ============================================================================
// ENDPOINT SPEC
// ============================================================================

export const EndpointMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export const EndpointParameterSchema = z.object({
  name: z.string().min(1),
  type: JsonSchemaTypeSchema,
  description: z.string().optional(),
  required: z.boolean().default(true),
  default: z.unknown().optional(),
  enum: z.array(z.union([z.string(), z.number()])).optional(),
});

export const EndpointSpecSchema = z.object({
  path: z.string().regex(/^\//, "Path must start with /"),
  method: EndpointMethodSchema.default("POST"),
  description: z.string().optional(),
  parameters: z.array(EndpointParameterSchema).optional(),
  inputSchema: JsonSchemaSchema.optional(),
  outputSchema: JsonSchemaSchema,
});

// ============================================================================
// TRAINING EXAMPLE
// ============================================================================

export const TrainingExampleSchema = z.object({
  input: z.union([z.string().min(1), z.record(z.unknown())]),
  output: z.record(z.unknown()),
  description: z.string().optional(),
});

// ============================================================================
// CONSTRAINTS
// ============================================================================

export const ConstraintsSchema = z.object({
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  responseFormat: z.enum(["json", "text"]).optional().default("json"),
  timeout: z.number().int().positive().optional(),
  retryOnFailure: z.boolean().optional().default(true),
  maxRetries: z.number().int().min(0).max(5).optional().default(3),
  validationStrict: z.boolean().optional().default(true),
});

// ============================================================================
// PROJECT SPEC (main schema)
// ============================================================================

export const ProjectSpecSchema = z.object({
  version: z.literal("1.0").default("1.0"),
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(1000).optional(),

  systemPrompt: z.string().min(10).max(10000),

  endpoints: z.array(EndpointSpecSchema).min(1),

  examples: z.array(TrainingExampleSchema).optional(),

  constraints: ConstraintsSchema.optional(),

  metadata: z
    .object({
      author: z.string().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      isPublic: z.boolean().optional().default(false),
    })
    .optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type JsonSchemaType = z.infer<typeof JsonSchemaTypeSchema>;

export interface JsonSchemaProperty {
  type?: JsonSchemaType | JsonSchemaType[];
  description?: string;
  enum?: (string | number | boolean)[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: string;
  default?: unknown;
  examples?: unknown[];
}

export type JsonSchema = z.infer<typeof JsonSchemaSchema>;
export type EndpointMethod = z.infer<typeof EndpointMethodSchema>;
export type EndpointParameter = z.infer<typeof EndpointParameterSchema>;
export type EndpointSpec = z.infer<typeof EndpointSpecSchema>;
export type TrainingExample = z.infer<typeof TrainingExampleSchema>;
export type Constraints = z.infer<typeof ConstraintsSchema>;
export type ProjectSpec = z.infer<typeof ProjectSpecSchema>;
