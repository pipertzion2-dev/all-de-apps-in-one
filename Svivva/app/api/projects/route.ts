import { NextRequest, NextResponse } from "next/server";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { generateProjectSpec, slugify } from "@/lib/llm";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const CreateProjectInputSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  name: z.string().min(1).max(100).optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await projectRepository.findByOwner(user.id);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validation = CreateProjectInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors.map((e) => e.message).join(", ") },
        { status: 400 },
      );
    }

    const { prompt, name } = validation.data;

    const result = await generateProjectSpec(prompt, name);

    if (!result.success || !result.spec) {
      return NextResponse.json(
        {
          error: "Failed to generate project spec",
          details: result.error,
          rawResponse: result.rawResponse,
        },
        { status: 422 },
      );
    }

    const spec = result.spec;

    const project = await projectRepository.create({
      ownerId: user.id,
      name: spec.name,
      slug: spec.slug,
      description: spec.description || null,
      systemPrompt: spec.systemPrompt,
      outputSchema: spec.endpoints[0].outputSchema,
      status: "draft",
    });

    const version = await versionRepository.create({
      projectId: project.id,
      version: 1,
      systemPrompt: spec.systemPrompt,
      outputSchema: spec.endpoints[0].outputSchema,
      changeSummary: "Initial version generated from prompt",
    });

    return NextResponse.json(
      {
        project,
        version,
        spec,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        error: "Failed to create project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
