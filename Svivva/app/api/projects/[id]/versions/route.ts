import { NextRequest, NextResponse } from "next/server";
import { versionRepository, projectRepository } from "@/lib/repositories";
import { insertProjectVersionSchema } from "@/lib/schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const project = await projectRepository.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

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
    const body = await request.json();

    const project = await projectRepository.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

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
