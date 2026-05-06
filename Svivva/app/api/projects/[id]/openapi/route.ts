import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { projectRepository } from "@/lib/repositories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function convertJsonSchemaToOpenAPI(schema: Record<string, unknown>): Record<string, unknown> {
  if (!schema || typeof schema !== "object") {
    return { type: "object" };
  }

  const result: Record<string, unknown> = {};

  if (schema.type) {
    result.type = schema.type;
  }

  if (schema.description) {
    result.description = schema.description;
  }

  if (schema.properties && typeof schema.properties === "object") {
    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema.properties as Record<string, unknown>)) {
      properties[key] = convertJsonSchemaToOpenAPI(value as Record<string, unknown>);
    }
    result.properties = properties;
  }

  if (schema.required) {
    result.required = schema.required;
  }

  if (schema.items) {
    result.items = convertJsonSchemaToOpenAPI(schema.items as Record<string, unknown>);
  }

  if (schema.enum) {
    result.enum = schema.enum;
  }

  if (schema.format) {
    result.format = schema.format;
  }

  if (schema.minimum !== undefined) result.minimum = schema.minimum;
  if (schema.maximum !== undefined) result.maximum = schema.maximum;
  if (schema.minLength !== undefined) result.minLength = schema.minLength;
  if (schema.maxLength !== undefined) result.maxLength = schema.maxLength;

  return result;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await projectRepository.findById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const baseUrl = request.nextUrl.origin;
    const outputSchema = project.outputSchema as Record<string, unknown>;
    const inputSchema = (project as Record<string, unknown>).inputSchema as Record<string, unknown> | undefined;
    
    const endpointPath = "main";

    const requestSchema = inputSchema 
      ? {
          type: "object",
          properties: {
            input: convertJsonSchemaToOpenAPI(inputSchema),
          },
          required: ["input"],
        }
      : {
          type: "object",
          properties: {
            input: {
              oneOf: [
                { type: "string", description: "Text input for the AI" },
                { type: "object", description: "Structured input object" },
              ],
            },
          },
          required: ["input"],
        };

    const openApiSpec = {
      openapi: "3.0.3",
      info: {
        title: project.name,
        description: project.description || `AI-powered API: ${project.name}`,
        version: "1.0.0",
        contact: {
          name: "Vivva API Platform",
        },
      },
      servers: [
        {
          url: baseUrl,
          description: "Production server",
        },
      ],
      paths: {
        [`/api/runtime/${project.id}/${endpointPath}`]: {
          post: {
            summary: `Execute ${project.name}`,
            description: project.systemPrompt,
            operationId: `execute_${project.slug.replace(/-/g, "_")}`,
            tags: [project.name],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: requestSchema,
                  examples: {
                    textInput: {
                      summary: "Text input example",
                      value: {
                        input: "Your input text here",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: convertJsonSchemaToOpenAPI(outputSchema),
                        processingTime: { type: "number", description: "Processing time in milliseconds" },
                        version: { type: "string", description: "API version used" },
                      },
                    },
                  },
                },
              },
              "400": {
                description: "Bad request - invalid input",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        error: { type: "string" },
                        details: { type: "string" },
                      },
                    },
                  },
                },
              },
              "401": {
                description: "Unauthorized - missing or invalid API key",
              },
              "404": {
                description: "Project not found",
              },
              "500": {
                description: "Internal server error",
              },
            },
            security: [
              {
                apiKey: [],
              },
            ],
          },
          get: {
            summary: `Get ${project.name} API info`,
            description: "Returns information about this API endpoint",
            operationId: `info_${project.slug.replace(/-/g, "_")}`,
            tags: [project.name],
            responses: {
              "200": {
                description: "API information",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        projectId: { type: "string" },
                        endpoint: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string" },
                        outputSchema: { type: "object" },
                        usage: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          apiKey: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
            description: "API key for authentication",
          },
        },
        schemas: {
          [`${project.slug}_output`]: convertJsonSchemaToOpenAPI(outputSchema),
        },
      },
    };

    const download = request.nextUrl.searchParams.get("download");
    
    if (download === "true") {
      const filename = `${project.slug}-openapi.json`;
      return new NextResponse(JSON.stringify(openApiSpec, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(openApiSpec);
  } catch (error) {
    console.error("Error generating OpenAPI spec:", error);
    return NextResponse.json({ error: "Failed to generate OpenAPI spec" }, { status: 500 });
  }
}
