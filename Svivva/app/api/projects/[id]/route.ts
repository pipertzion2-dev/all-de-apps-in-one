import { NextRequest, NextResponse } from "next/server";
import { projectRepository } from "@/lib/repositories";
import { requireProjectOwner } from "@/lib/auth/require-project-owner";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { project, error } = await requireProjectOwner(id);
    if (error) return error;

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireProjectOwner(id);
    if (error) return error;

    const body = await request.json();
    const { ownerId: _ownerId, id: _id, ...updates } = body as Record<string, unknown>;

    const project = await projectRepository.update(id, updates);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error } = await requireProjectOwner(id);
    if (error) return error;

    const deleted = await projectRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
