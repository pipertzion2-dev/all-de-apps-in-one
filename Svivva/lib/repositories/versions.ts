import { db } from "@/lib/db";
import { projectVersions, type ProjectVersion, type InsertProjectVersion } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { QueryOptions } from "./base";

export class VersionRepository {
  async findById(id: string): Promise<ProjectVersion | undefined> {
    const [result] = await db.select().from(projectVersions).where(eq(projectVersions.id, id));
    return result;
  }

  async findByProject(projectId: string, options?: QueryOptions): Promise<ProjectVersion[]> {
    let query = db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, projectId))
      .orderBy(desc(projectVersions.version));

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    return query;
  }

  async findByVersionNumber(
    projectId: string,
    version: number,
  ): Promise<ProjectVersion | undefined> {
    const [result] = await db
      .select()
      .from(projectVersions)
      .where(and(eq(projectVersions.projectId, projectId), eq(projectVersions.version, version)));
    return result;
  }

  async getLatestVersion(projectId: string): Promise<ProjectVersion | undefined> {
    const [result] = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, projectId))
      .orderBy(desc(projectVersions.version))
      .limit(1);
    return result;
  }

  async findLatestByProjectId(projectId: string): Promise<ProjectVersion | undefined> {
    return this.getLatestVersion(projectId);
  }

  async getNextVersionNumber(projectId: string): Promise<number> {
    const latest = await this.getLatestVersion(projectId);
    return latest ? latest.version + 1 : 1;
  }

  async create(data: InsertProjectVersion): Promise<ProjectVersion> {
    const nextVersion = await this.getNextVersionNumber(data.projectId);

    const [result] = await db
      .insert(projectVersions)
      .values({
        id: uuidv4(),
        ...data,
        version: data.version ?? nextVersion,
      })
      .returning();
    return result;
  }

  async createFromProject(
    projectId: string,
    systemPrompt: string,
    outputSchema: Record<string, unknown>,
    changeSummary?: string,
  ): Promise<ProjectVersion> {
    const nextVersion = await this.getNextVersionNumber(projectId);

    const [result] = await db
      .insert(projectVersions)
      .values({
        id: uuidv4(),
        projectId,
        version: nextVersion,
        systemPrompt,
        outputSchema,
        changeSummary,
      })
      .returning();
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(projectVersions).where(eq(projectVersions.id, id)).returning();
    return result.length > 0;
  }

  async countByProject(projectId: string): Promise<number> {
    const result = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, projectId));
    return result.length;
  }

  async deleteByProject(projectId: string): Promise<number> {
    const result = await db
      .delete(projectVersions)
      .where(eq(projectVersions.projectId, projectId))
      .returning();
    return result.length;
  }
}

export const versionRepository = new VersionRepository();
