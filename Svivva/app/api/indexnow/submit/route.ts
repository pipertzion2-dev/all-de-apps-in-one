import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { seedCredentials, blogPosts, seoLandingPages } from "@/lib/schema";
import { eq, isNotNull, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

async function getAllUrls(): Promise<string[]> {
  const staticUrls = [
    BASE_URL,
    `${BASE_URL}/blog`,
    `${BASE_URL}/tools`,
    `${BASE_URL}/about`,
    `${BASE_URL}/pricing`,
    `${BASE_URL}/docs`,
  ];
  const posts = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));
  const pages = await db
    .select({ slug: seoLandingPages.slug })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true));
  return [
    ...staticUrls,
    ...posts.map((p) => `${BASE_URL}/blog/${p.slug}`),
    ...pages.map((p) => `${BASE_URL}/${p.slug}`),
  ];
}

export async function POST(req: Request) {
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal = internalSecret && internalSecret === process.env.ORBIT_INTERNAL_SECRET;
  if (!isInternal) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [credRow] = await db
    .select({ indexnowKey: seedCredentials.indexnowKey })
    .from(seedCredentials)
    .where(isNotNull(seedCredentials.indexnowKey))
    .orderBy(desc(seedCredentials.updatedAt))
    .limit(1);

  const key = credRow?.indexnowKey;
  if (!key)
    return NextResponse.json(
      { error: "No IndexNow key configured. Run IndexNow Setup in Orbit first." },
      { status: 400 },
    );

  const urls = await getAllUrls();
  const host = BASE_URL.replace(/^https?:\/\//, "");
  const keyLocation = `${BASE_URL}/${key}.txt`;
  const body = JSON.stringify({ host, key, keyLocation, urlList: urls });

  let status = 0;
  try {
    const [r1] = await Promise.allSettled([
      fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
        signal: AbortSignal.timeout(30000),
      }),
    ]);
    // Fire-and-forget Bing
    fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body,
      signal: AbortSignal.timeout(30000),
    }).catch(() => {});

    status = r1.status === "fulfilled" ? r1.value.status : 0;
  } catch {
    return NextResponse.json({ error: "Network error reaching IndexNow API" }, { status: 500 });
  }

  const ok = status === 200 || status === 202;

  if (ok) {
    await db.update(seedCredentials).set({ lastIndexnowSubmit: new Date(), updatedAt: new Date() });
  }

  if (status === 403)
    return NextResponse.json(
      { error: `Key verification failed (403) — key file must be at ${keyLocation}` },
      { status: 400 },
    );
  if (status === 422)
    return NextResponse.json({ error: "Invalid URL format (422)" }, { status: 400 });
  if (!ok) return NextResponse.json({ error: `IndexNow returned HTTP ${status}` }, { status: 400 });

  return NextResponse.json({
    success: true,
    urlCount: urls.length,
    submittedTo: ["api.indexnow.org (Bing, Yandex, Yahoo)", "www.bing.com"],
  });
}
