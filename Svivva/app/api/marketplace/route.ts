import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { marketplaceListings, users, projects } from "@/lib/schema";
import { eq, desc, and, sql, or, ilike } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const createListingSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(200).optional(),
  category: z.enum(["general", "ai-ml", "data", "automation", "content", "commerce", "analytics", "social", "developer-tools"]).default("general"),
  tags: z.array(z.string()).max(10).default([]),
  priceType: z.enum(["free", "one-time", "subscription"]).default("free"),
  priceAmount: z.number().min(0).max(100000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .select({
        id: marketplaceListings.id,
        projectId: marketplaceListings.projectId,
        title: marketplaceListings.title,
        shortDescription: marketplaceListings.shortDescription,
        category: marketplaceListings.category,
        tags: marketplaceListings.tags,
        priceType: marketplaceListings.priceType,
        priceAmount: marketplaceListings.priceAmount,
        currency: marketplaceListings.currency,
        totalPurchases: marketplaceListings.totalPurchases,
        averageRating: marketplaceListings.averageRating,
        reviewCount: marketplaceListings.reviewCount,
        featuredAt: marketplaceListings.featuredAt,
        createdAt: marketplaceListings.createdAt,
        ownerName: users.name,
        ownerImage: users.avatarUrl,
        projectName: projects.name,
        projectSlug: projects.slug,
      })
      .from(marketplaceListings)
      .innerJoin(users, eq(marketplaceListings.ownerId, users.id))
      .innerJoin(projects, eq(marketplaceListings.projectId, projects.id))
      .where(eq(marketplaceListings.status, "published"))
      .$dynamic();

    if (category && category !== "all") {
      query = query.where(eq(marketplaceListings.category, category));
    }

    if (search) {
      query = query.where(
        or(
          ilike(marketplaceListings.title, `%${search}%`),
          ilike(marketplaceListings.shortDescription, `%${search}%`)
        )
      );
    }

    if (featured) {
      query = query.where(sql`${marketplaceListings.featuredAt} IS NOT NULL`);
    }

    const listings = await query
      .orderBy(desc(marketplaceListings.totalPurchases))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketplaceListings)
      .where(eq(marketplaceListings.status, "published"));

    return NextResponse.json({
      listings,
      total: countResult?.count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching marketplace:", error);
    return NextResponse.json({ error: "Failed to fetch marketplace" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createListingSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { projectId, title, description, shortDescription, category, tags, priceType, priceAmount } = parsed.data;

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [existingListing] = await db
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.projectId, projectId));

    if (existingListing) {
      return NextResponse.json({ error: "Project already has a listing" }, { status: 400 });
    }

    if (priceType !== "free" && (!priceAmount || priceAmount < 100)) {
      return NextResponse.json({ error: "Minimum price is $1.00 (100 cents)" }, { status: 400 });
    }

    const [listing] = await db
      .insert(marketplaceListings)
      .values({
        id: nanoid(),
        projectId,
        ownerId: user.id,
        title,
        description: description || null,
        shortDescription: shortDescription || null,
        category,
        tags,
        priceType,
        priceAmount: priceType === "free" ? null : priceAmount,
        status: "draft",
      })
      .returning();

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
