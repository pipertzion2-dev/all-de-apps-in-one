import { db } from "@/lib/db";
import { marketingCampaigns } from "@/lib/marketing/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getCampaigns() {
  return db.select().from(marketingCampaigns).orderBy(desc(marketingCampaigns.createdAt));
}

export async function getCampaignById(id: string) {
  const [campaign] = await db
    .select()
    .from(marketingCampaigns)
    .where(eq(marketingCampaigns.id, id));
  return campaign ?? null;
}

export async function createCampaign(data: {
  name: string;
  description?: string;
  channel: string;
  budget?: number;
  targetAudience?: string;
  startDate?: string;
  endDate?: string;
  goals?: { clicks?: number; conversions?: number; leads?: number; revenue?: number };
  tags?: string[];
}) {
  const [campaign] = await db
    .insert(marketingCampaigns)
    .values({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    })
    .returning();
  return campaign;
}

export async function updateCampaignStatus(id: string, status: string) {
  const [campaign] = await db
    .update(marketingCampaigns)
    .set({ status, updatedAt: new Date() })
    .where(eq(marketingCampaigns.id, id))
    .returning();
  return campaign;
}

export async function updateCampaignMetrics(
  id: string,
  metrics: {
    clicks?: number;
    impressions?: number;
    conversions?: number;
    leads?: number;
    revenue?: number;
  },
) {
  const [campaign] = await db
    .update(marketingCampaigns)
    .set({ metrics: metrics as any, updatedAt: new Date() })
    .where(eq(marketingCampaigns.id, id))
    .returning();
  return campaign;
}

export async function getCampaignSummary() {
  const all = await db.select().from(marketingCampaigns);
  return {
    total: all.length,
    active: all.filter((c) => c.status === "active").length,
    totalBudget: all.reduce((sum, c) => sum + (c.budget ?? 0), 0),
    totalSpent: all.reduce((sum, c) => sum + (c.spent ?? 0), 0),
    totalLeads: all.reduce((sum, c) => sum + ((c.metrics as any)?.leads ?? 0), 0),
    totalConversions: all.reduce((sum, c) => sum + ((c.metrics as any)?.conversions ?? 0), 0),
    byChannel: Object.fromEntries(
      ["email", "social", "seo", "paid", "referral", "content"].map((ch) => [
        ch,
        all.filter((c) => c.channel === ch).length,
      ]),
    ),
  };
}
