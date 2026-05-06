import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { marketplaceListings, marketplaceReviews, marketplacePurchases, users, projects } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [listing] = await db
      .select({
        id: marketplaceListings.id,
        projectId: marketplaceListings.projectId,
        title: marketplaceListings.title,
        description: marketplaceListings.description,
        shortDescription: marketplaceListings.shortDescription,
        category: marketplaceListings.category,
        tags: marketplaceListings.tags,
        priceType: marketplaceListings.priceType,
        priceAmount: marketplaceListings.priceAmount,
        currency: marketplaceListings.currency,
        status: marketplaceListings.status,
        totalPurchases: marketplaceListings.totalPurchases,
        totalRevenue: marketplaceListings.totalRevenue,
        averageRating: marketplaceListings.averageRating,
        reviewCount: marketplaceListings.reviewCount,
        featuredAt: marketplaceListings.featuredAt,
        createdAt: marketplaceListings.createdAt,
        ownerId: marketplaceListings.ownerId,
        ownerName: users.name,
        ownerImage: users.avatarUrl,
        projectName: projects.name,
        projectSlug: projects.slug,
        projectDescription: projects.description,
      })
      .from(marketplaceListings)
      .innerJoin(users, eq(marketplaceListings.ownerId, users.id))
      .innerJoin(projects, eq(marketplaceListings.projectId, projects.id))
      .where(eq(marketplaceListings.id, id));

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const reviews = await db
      .select({
        id: marketplaceReviews.id,
        rating: marketplaceReviews.rating,
        title: marketplaceReviews.title,
        body: marketplaceReviews.body,
        isVerifiedPurchase: marketplaceReviews.isVerifiedPurchase,
        createdAt: marketplaceReviews.createdAt,
        userName: users.name,
        userImage: users.avatarUrl,
      })
      .from(marketplaceReviews)
      .innerJoin(users, eq(marketplaceReviews.userId, users.id))
      .where(eq(marketplaceReviews.listingId, id))
      .orderBy(desc(marketplaceReviews.createdAt))
      .limit(10);

    const user = await getCurrentUser();
    let hasPurchased = false;

    if (user) {
      const [purchase] = await db
        .select()
        .from(marketplacePurchases)
        .where(
          and(
            eq(marketplacePurchases.listingId, id),
            eq(marketplacePurchases.buyerId, user.id),
            eq(marketplacePurchases.status, "completed")
          )
        );
      hasPurchased = !!purchase;
    }

    return NextResponse.json({
      ...listing,
      reviews,
      hasPurchased,
      isOwner: user?.id === listing.ownerId,
    });
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [listing] = await db
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.id, id));

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      shortDescription,
      category,
      tags,
      priceType,
      priceAmount,
      status,
    } = body as {
      title?: string;
      description?: string;
      shortDescription?: string;
      category?: string;
      tags?: string[];
      priceType?: string;
      priceAmount?: number;
      status?: string;
    };

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (priceType) updateData.priceType = priceType;
    if (priceAmount !== undefined) updateData.priceAmount = priceAmount;
    if (status && ["draft", "published", "archived"].includes(status)) {
      updateData.status = status;
    }

    const [updated] = await db
      .update(marketplaceListings)
      .set(updateData)
      .where(eq(marketplaceListings.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [listing] = await db
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.id, id));

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(marketplaceListings).where(eq(marketplaceListings.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
