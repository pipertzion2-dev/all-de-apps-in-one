import { NextRequest, NextResponse } from "next/server";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { trainingExamples } from "@/lib/schema";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { openai } from "@/lib/llm/openai";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ImportTrainingSchema = z.object({
  format: z.enum(["json", "csv"]),
  data: z.string(),
  mapping: z.object({
    inputField: z.string().default("input"),
    outputField: z.string().default("output"),
  }).optional(),
  aiAssist: z.boolean().default(false),
});

function parseCSV(csvString: string): Record<string, string>[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

async function enhanceWithAI(examples: { input: string; output: unknown }[], outputSchema: Record<string, unknown>) {
  
  const enhanced: { input: string; output: Record<string, unknown>; aiEnhanced: boolean }[] = [];
  
  for (const example of examples) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are helping format training data for an AI API. The output must conform to this JSON schema: ${JSON.stringify(outputSchema)}. Return ONLY valid JSON matching the schema.`
          },
          {
            role: "user",
            content: `Given this input: "${example.input}" and this raw output: ${JSON.stringify(example.output)}, format it to match the schema. Return ONLY the formatted JSON object.`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        enhanced.push({
          input: example.input,
          output: JSON.parse(content),
          aiEnhanced: true,
        });
      }
    } catch (error) {
      enhanced.push({
        input: example.input,
        output: typeof example.output === 'object' ? example.output as Record<string, unknown> : { value: example.output },
        aiEnhanced: false,
      });
    }
  }
  
  return enhanced;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const latestVersion = await versionRepository.findLatestByProjectId(projectId);
    if (!latestVersion) {
      return NextResponse.json({ error: "No version found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = ImportTrainingSchema.parse(body);
    const mapping = parsed.mapping || { inputField: "input", outputField: "output" };

    let rawData: Record<string, unknown>[];
    
    if (parsed.format === "json") {
      try {
        const jsonData = JSON.parse(parsed.data);
        rawData = Array.isArray(jsonData) ? jsonData : [jsonData];
      } catch {
        return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 });
      }
    } else {
      rawData = parseCSV(parsed.data);
    }

    if (rawData.length === 0) {
      return NextResponse.json({ error: "No data to import" }, { status: 400 });
    }

    let examples = rawData.map((row) => ({
      input: String(row[mapping.inputField] || ""),
      output: row[mapping.outputField],
    })).filter(e => e.input.trim() !== "");

    if (examples.length === 0) {
      return NextResponse.json({ 
        error: `No valid examples found. Check that your data has '${mapping.inputField}' field.`,
        availableFields: rawData[0] ? Object.keys(rawData[0]) : [],
      }, { status: 400 });
    }

    let processedExamples: { input: string; output: Record<string, unknown>; aiEnhanced?: boolean }[];
    
    if (parsed.aiAssist) {
      processedExamples = await enhanceWithAI(examples, latestVersion.outputSchema as Record<string, unknown>);
    } else {
      processedExamples = examples.map(e => ({
        input: e.input,
        output: typeof e.output === 'object' && e.output !== null ? e.output as Record<string, unknown> : { value: e.output },
        aiEnhanced: false,
      }));
    }

    const existingCount = await db
      .select()
      .from(trainingExamples)
      .where(eq(trainingExamples.versionId, latestVersion.id));

    const toInsert = processedExamples.map((example, index) => ({
      id: uuidv4(),
      versionId: latestVersion.id,
      input: example.input,
      output: example.output,
      sortOrder: existingCount.length + index,
    }));

    await db.insert(trainingExamples).values(toInsert);

    return NextResponse.json({
      success: true,
      imported: toInsert.length,
      aiEnhanced: processedExamples.filter(e => e.aiEnhanced).length,
      examples: toInsert.slice(0, 5),
      preview: toInsert.length > 5 ? `... and ${toInsert.length - 5} more` : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Import training data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
