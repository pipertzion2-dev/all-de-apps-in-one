import { db } from "@/lib/db";
import { marketingUtmLinks } from "@/lib/marketing/schema";
import { eq, desc } from "drizzle-orm";

export function buildUtmUrl(params: {
  destinationUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
}): string {
  const url = new URL(params.destinationUrl);
  url.searchParams.set("utm_source", params.utmSource);
  url.searchParams.set("utm_medium", params.utmMedium);
  url.searchParams.set("utm_campaign", params.utmCampaign);
  if (params.utmTerm) url.searchParams.set("utm_term", params.utmTerm);
  if (params.utmContent) url.searchParams.set("utm_content", params.utmContent);
  return url.toString();
}

export async function createUtmLink(data: {
  name: string;
  destinationUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
  campaignId?: string;
}) {
  const shortCode = Math.random().toString(36).slice(2, 8);
  const [link] = await db
    .insert(marketingUtmLinks)
    .values({ ...data, shortCode })
    .returning();
  return link;
}

export async function getUtmLinks() {
  return db.select().from(marketingUtmLinks).orderBy(desc(marketingUtmLinks.createdAt));
}

export async function getUtmLinkById(id: string) {
  const [link] = await db.select().from(marketingUtmLinks).where(eq(marketingUtmLinks.id, id));
  return link ?? null;
}

export async function incrementUtmClicks(id: string) {
  const [link] = await db.select().from(marketingUtmLinks).where(eq(marketingUtmLinks.id, id));
  if (!link) return null;
  await db
    .update(marketingUtmLinks)
    .set({ clicks: (link.clicks ?? 0) + 1 })
    .where(eq(marketingUtmLinks.id, id));
}
