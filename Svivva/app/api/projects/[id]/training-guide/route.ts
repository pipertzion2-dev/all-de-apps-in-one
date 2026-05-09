import { NextRequest, NextResponse } from "next/server";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { trainingExamples } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { openai } from "@/lib/llm/openai";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const examples = await db
      .select()
      .from(trainingExamples)
      .where(eq(trainingExamples.versionId, latestVersion.id))
      .limit(3);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a technical documentation expert. Generate a clear, step-by-step guide for adding training data to an AI API. The guide should be practical and easy to follow.`,
        },
        {
          role: "user",
          content: `Generate a training data guide for this AI API:

Project: ${project.name}
Description: ${project.description || "No description"}
System Prompt: ${latestVersion.systemPrompt}
Output Schema: ${JSON.stringify(latestVersion.outputSchema, null, 2)}
Current Training Examples: ${examples.length}

${
  examples.length > 0
    ? `Example training data:
${examples
  .map(
    (e, i) => `Example ${i + 1}:
Input: ${e.input}
Output: ${JSON.stringify(e.output, null, 2)}`,
  )
  .join("\n\n")}`
    : ""
}

Generate a comprehensive guide that includes:
1. Overview of what makes good training data for this specific API
2. Step-by-step instructions for adding single examples
3. How to bulk import via JSON or CSV
4. Best practices for quality training data
5. Common mistakes to avoid
6. Example inputs and expected outputs based on the schema

Format the guide in Markdown.`,
        },
      ],
      max_tokens: 3000,
    });

    const guide = response.choices[0]?.message?.content || "Unable to generate guide";

    return NextResponse.json({
      success: true,
      projectId,
      projectName: project.name,
      version: latestVersion.version,
      currentExamplesCount: examples.length,
      guide,
      metadata: {
        outputSchema: latestVersion.outputSchema,
        systemPrompt: latestVersion.systemPrompt,
      },
    });
  } catch (error) {
    console.error("Generate training guide error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return GET(request, { params });
}
