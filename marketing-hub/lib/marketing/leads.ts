import { db } from "@/server/db";
import { marketingLeads } from "@/lib/marketing/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

function computeLeadScore(data: {
  company?: string | null;
  phone?: string | null;
  source?: string | null;
  utmSource?: string | null;
}) {
  let score = 10; // base
  if (data.company) score += 20;
  if (data.phone) score += 10;
  if (data.source === "referral") score += 30;
  if (data.source === "paid") score += 15;
  if (data.source === "organic") score += 10;
  return Math.min(score, 100);
}

export async function getLeads(search?: string) {
  if (search) {
    return db
      .select()
      .from(marketingLeads)
      .where(or(ilike(marketingLeads.email, `%${search}%`), ilike(marketingLeads.firstName ?? "", `%${search}%`), ilike(marketingLeads.company ?? "", `%${search}%`)))
      .orderBy(desc(marketingLeads.createdAt));
  }
  return db.select().from(marketingLeads).orderBy(desc(marketingLeads.createdAt));
}

export async function getLeadById(id: string) {
  const [lead] = await db.select().from(marketingLeads).where(eq(marketingLeads.id, id));
  return lead ?? null;
}

export async function captureLead(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  source?: string;
  campaignId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  metadata?: Record<string, string>;
}) {
  const score = computeLeadScore(data);
  const [lead] = await db
    .insert(marketingLeads)
    .values({ ...data, score })
    .onConflictDoUpdate({
      target: marketingLeads.email,
      set: {
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        phone: data.phone,
        score,
        lastActivityAt: new Date(),
      },
    })
    .returning();
  return lead;
}

export async function updateLeadStatus(id: string, status: string) {
  const [lead] = await db
    .update(marketingLeads)
    .set({ status, lastActivityAt: new Date() })
    .where(eq(marketingLeads.id, id))
    .returning();
  return lead;
}

export async function getLeadStats() {
  const all = await db.select().from(marketingLeads);
  return {
    total: all.length,
    new: all.filter((l) => l.status === "new").length,
    qualified: all.filter((l) => l.status === "qualified").length,
    converted: all.filter((l) => l.status === "converted").length,
    avgScore: all.length ? Math.round(all.reduce((s, l) => s + (l.score ?? 0), 0) / all.length) : 0,
    bySource: Object.fromEntries(
      ["organic", "referral", "paid", "social", "email", "direct"].map((src) => [
        src,
        all.filter((l) => l.source === src).length,
      ])
    ),
  };
}
