import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";

export interface ReplItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  imageUrl?: string;
}

const GQL_URL = "https://replit.com/graphql";

const PUBLIC_REPLS_QUERY = `
query GetUserRepls($username: String!, $count: Int) {
  userByUsername(username: $username) {
    username
    publicRepls(count: $count) {
      items {
        id
        title
        slug
        description
        url
        iconUrl
      }
    }
  }
}
`;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select()
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, user.id))
      .limit(1);

    const creds = rows[0];
    const username = creds?.replitUsername || null;

    if (!username) {
      return NextResponse.json({
        error:
          "Optional Replit catalog: add your Replit username under Connected Services to list public Repls. Or paste any deployed app URL directly in Orbit — Replit is not required.",
        repls: [],
      });
    }

    const res = await fetch(GQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://replit.com",
        "User-Agent": "Mozilla/5.0 Svivva/1.0",
      },
      body: JSON.stringify({
        query: PUBLIC_REPLS_QUERY,
        variables: { username, count: 100 },
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[replit-repls] GQL error:", res.status, body.slice(0, 200));
      return NextResponse.json({ error: `Replit API returned ${res.status}`, repls: [] });
    }

    const data = await res.json();

    if (data.errors?.length) {
      console.error("Replit GraphQL errors:", JSON.stringify(data.errors));
      return NextResponse.json({
        error: `Replit API error: ${data.errors[0]?.message || "Unknown"}`,
        repls: [],
      });
    }

    const rawItems = data?.data?.userByUsername?.publicRepls?.items || [];

    const items: ReplItem[] = rawItems.map((r: any) => ({
      id: r.id || r.slug,
      title: r.title || r.slug,
      slug: r.slug || r.id,
      description: r.description || "",
      url: r.url || `https://replit.com/@${username}/${r.slug}`,
      imageUrl: r.iconUrl || null,
    }));

    return NextResponse.json({ repls: items, total: items.length, username });
  } catch (e) {
    console.error("replit-repls error:", e);
    return NextResponse.json({ error: String(e), repls: [] });
  }
}
