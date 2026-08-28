import { projectRepository } from "@/lib/repositories";
import type { Project } from "@/lib/schema";
import { forbidden, notFound, unauthorized } from "@/lib/http-response";
import { requireUser } from "@/lib/auth/require-user";
import type { SessionUser } from "@/lib/auth/session";

type RequireProjectOwnerResult =
  | { user: SessionUser; project: Project; error: null }
  | { user: SessionUser | null; project: null; error: Response };

export async function requireProjectOwner(projectId: string): Promise<RequireProjectOwnerResult> {
  const { user, error: authError } = await requireUser();
  if (authError || !user) {
    return { user: null, project: null, error: authError ?? unauthorized() };
  }

  const project = await projectRepository.findById(projectId);
  if (!project) {
    return { user, project: null, error: notFound("Project not found") };
  }

  if (project.ownerId !== user.id) {
    return { user, project: null, error: forbidden() };
  }

  return { user, project, error: null };
}
