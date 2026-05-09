import { NextResponse, NextRequest } from "next/server";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, verbose: true });

export async function POST(req: NextRequest) {
  try {
    const { json, schema } = await req.json();

    if (!json || !schema) {
      return NextResponse.json(
        { error: "Both 'json' and 'schema' are required." },
        { status: 400 },
      );
    }

    let parsedJson: unknown;
    let parsedSchema: unknown;

    try {
      parsedJson = JSON.parse(json);
    } catch (e) {
      return NextResponse.json({
        valid: false,
        errors: [{ message: `Invalid JSON: ${(e as Error).message}`, path: "" }],
        parseError: "json",
      });
    }

    try {
      parsedSchema = JSON.parse(schema);
    } catch (e) {
      return NextResponse.json({
        valid: false,
        errors: [{ message: `Invalid JSON Schema: ${(e as Error).message}`, path: "" }],
        parseError: "schema",
      });
    }

    const validate = ajv.compile(parsedSchema as object);
    const valid = validate(parsedJson);

    if (valid) {
      return NextResponse.json({
        valid: true,
        errors: [],
        message: "✓ Valid — JSON matches the schema perfectly.",
      });
    }

    const errors = (validate.errors || []).map((e) => ({
      path: e.instancePath || "/",
      keyword: e.keyword,
      message: e.message || "Validation failed",
      params: e.params,
      schemaPath: e.schemaPath,
    }));

    return NextResponse.json({
      valid: false,
      errors,
      message: `${errors.length} validation error${errors.length === 1 ? "" : "s"} found.`,
    });
  } catch (e) {
    return NextResponse.json({ error: `Server error: ${String(e)}` }, { status: 500 });
  }
}
