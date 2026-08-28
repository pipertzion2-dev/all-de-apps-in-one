import { NextRequest, NextResponse } from "next/server";
import { versionRepository } from "@/lib/repositories";
import { insertProjectVersionSchema } from "@/lib/schema";
import { requireProjectOwner } from "@/lib/auth/require-project-owner";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireProjectOwner(id);
    if (error) return error;

    const versions = await versionRepository.findByProject(id);
    return NextResponse.json(versions);
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { project, error } = await requireProjectOwner(id);
    if (error) return error;

    const body = await request.json();

    const version = await versionRepository.createFromProject(
      id,
      body.systemPrompt ?? project.systemPrompt,
      body.outputSchema ?? project.outputSchema,
      body.changeSummary,
    );

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error("Error creating version:", error);
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 });
  }
}
