import { db } from "@/lib/db";
import { projects, type Project, type InsertProject } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { QueryOptions } from "./base";

export class ProjectRepository {
  async findById(id: string): Promise<Project | undefined> {
    const [result] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return result;
  }

  async findByOwner(ownerId: string, options?: QueryOptions): Promise<Project[]> {
    let query = db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, ownerId))
      .orderBy(desc(projects.updatedAt));

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    return query;
  }

  async findBySlug(ownerId: string, slug: string): Promise<Project | undefined> {
    const [result] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.ownerId, ownerId), eq(projects.slug, slug)));
    return result;
  }

  async findByStatus(status: string, options?: QueryOptions): Promise<Project[]> {
    let query = db
      .select()
      .from(projects)
      .where(eq(projects.status, status))
      .orderBy(desc(projects.updatedAt));

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }

    return query;
  }

  async findAll(options?: QueryOptions): Promise<Project[]> {
    let query = db
      .select()
      .from(projects)
      .orderBy(desc(projects.updatedAt));

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    return query;
  }

  async create(data: InsertProject): Promise<Project> {
    const [result] = await db
      .insert(projects)
      .values({
        id: uuidv4(),
        ...data,
      })
      .returning();
    return result;
  }

  async update(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [result] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    return result;
  }

  async updateStatus(id: string, status: string): Promise<Project | undefined> {
    return this.update(id, { status } as Partial<InsertProject>);
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();
    return result.length > 0;
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return result !== undefined;
  }

  async countByOwner(ownerId: string): Promise<number> {
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, ownerId));
    return result.length;
  }

  async count(): Promise<number> {
    const result = await db.select().from(projects);
    return result.length;
  }
}

export const projectRepository = new ProjectRepository();
