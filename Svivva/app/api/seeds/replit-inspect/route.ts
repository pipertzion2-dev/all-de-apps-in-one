import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";

const REPLIT_GQL = "https://replit.com/graphql";

const FILES_QUERY = `
query GetReplFiles($id: String!) {
  repl(id: $id) {
    id
    title
    description
  }
}
`;

const REPL_DETAIL_QUERY = `
query GetReplDetail($url: String!) {
  repl(url: $url) {
    id
    title
    description
    slug
    language
  }
}
`;

const SUB_APP_INDICATORS = [
  { pattern: /\/apps\//i, label: "Monorepo /apps/ structure" },
  { pattern: /\/packages\//i, label: "Monorepo /packages/ structure" },
  { pattern: /\/services\//i, label: "Microservices structure" },
  { pattern: /mini.?app|sub.?app|micro.?app/i, label: "Mini-app references" },
  { pattern: /(\d+)\s+(app|service|module)/i, label: "Multiple apps mentioned" },
  { pattern: /dashboard.*api|api.*dashboard/i, label: "Dashboard + API split" },
  { pattern: /frontend.*backend|backend.*frontend/i, label: "Frontend/backend split" },
  { pattern: /admin.*portal|portal.*admin/i, label: "Admin + Portal split" },
];

function detectSubAppsFromDescription(description: string): {
  detected: boolean;
  hints: string[];
  suggestedSubApps: { name: string; description: string; path: string }[];
} {
  const hints: string[] = [];
  for (const { pattern, label } of SUB_APP_INDICATORS) {
    if (pattern.test(description)) hints.push(label);
  }

  const suggested: { name: string; description: string; path: string }[] = [];

  if (/frontend.*backend|backend.*frontend/i.test(description)) {
    suggested.push({
      name: "frontend",
      description: "User-facing web application",
      path: "/frontend",
    });
    suggested.push({ name: "backend", description: "API server and data layer", path: "/backend" });
  } else if (/dashboard.*api|api.*dashboard/i.test(description)) {
    suggested.push({
      name: "dashboard",
      description: "Admin/user dashboard interface",
      path: "/dashboard",
    });
    suggested.push({ name: "api", description: "REST API service", path: "/api" });
  } else if (/admin.*portal|portal.*admin/i.test(description)) {
    suggested.push({ name: "admin", description: "Admin control panel", path: "/admin" });
    suggested.push({ name: "portal", description: "User portal", path: "/portal" });
  } else if (/\/apps\//i.test(description) || /(\d+)\s+(app|service)/i.test(description)) {
    const match = description.match(/(\w+)\s+app/gi);
    if (match) {
      match.slice(0, 4).forEach((m, i) => {
        const name = m
          .replace(/\s+app$/i, "")
          .toLowerCase()
          .replace(/\s+/g, "-");
        suggested.push({ name, description: `${m} module`, path: `/apps/${name}` });
      });
    }
  }

  return { detected: hints.length > 0, hints, suggestedSubApps: suggested };
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasAdminAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { replId, replTitle, replDescription } = await req.json();
    if (!replId) return NextResponse.json({ error: "replId required" }, { status: 400 });

    const [creds] = await db
      .select()
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, user.id))
      .limit(1);

    let description = replDescription || "";
    let title = replTitle || replId;

    if (creds?.replitToken && !replDescription) {
      try {
        const gqlRes = await fetch(REPLIT_GQL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${creds.replitToken}`,
            "X-Requested-With": "XMLHttpRequest",
            Referer: "https://replit.com",
          },
          body: JSON.stringify({ query: FILES_QUERY, variables: { id: replId } }),
          signal: AbortSignal.timeout(8000),
        });
        if (gqlRes.ok) {
          const data = await gqlRes.json();
          const repl = data?.data?.repl;
          if (repl) {
            description = repl.description || description;
            title = repl.title || title;
          }
        }
      } catch {
        /* best-effort */
      }
    }

    const analysis = detectSubAppsFromDescription(description);

    return NextResponse.json({
      replId,
      title,
      description,
      analysis,
    });
  } catch (e) {
    console.error("replit-inspect error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
