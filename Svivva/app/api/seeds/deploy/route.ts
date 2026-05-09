import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seeds, seedSessions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import archiver from "archiver";
import { PassThrough } from "stream";
import path from "path";

function sanitizePath(filePath: string): string | null {
  const cleaned = filePath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter((seg) => seg !== ".." && seg !== "." && seg.length > 0)
    .join("/");

  if (!cleaned || cleaned.length === 0) return null;

  const normalized = path.posix.normalize(cleaned);
  if (normalized.startsWith("..") || path.posix.isAbsolute(normalized)) return null;

  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { seedId } = body;

    if (!seedId) {
      return NextResponse.json({ error: "seedId is required" }, { status: 400 });
    }

    const [seed] = await db.select().from(seeds).where(eq(seeds.id, seedId)).limit(1);

    if (!seed) {
      return NextResponse.json({ error: "Seed not found" }, { status: 404 });
    }

    const [session] = await db
      .select()
      .from(seedSessions)
      .where(and(eq(seedSessions.id, seed.sessionId), eq(seedSessions.userId, user.id)))
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const generatedCode = seed.generatedCode as Record<string, string> | null;

    if (!generatedCode || Object.keys(generatedCode).length === 0) {
      return NextResponse.json(
        { error: "No generated code available. Build this seed first." },
        { status: 400 },
      );
    }

    const spec = seed.spec as {
      appName?: string;
      problemStatement?: string;
      features?: string[];
      apiEndpoints?: string[];
      databaseSchema?: string;
      targetUsers?: string;
      businessModel?: string;
    };

    const appSlug = (seed.appName || "svivva-app")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const passthrough = new PassThrough();
    const chunks: Buffer[] = [];
    passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err: Error) => {
      console.error("Archive error:", err);
    });

    passthrough.on("error", (err: Error) => {
      console.error("Stream error:", err);
    });

    archive.pipe(passthrough);

    for (const [filePath, content] of Object.entries(generatedCode)) {
      const safePath = sanitizePath(filePath);
      if (!safePath) continue;
      archive.append(content, { name: `${appSlug}/${safePath}` });
    }

    const readme = `# ${seed.appName}

${spec.problemStatement || ""}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features
${(spec.features || []).map((f: string) => `- ${f}`).join("\n")}

## API Endpoints
${(spec.apiEndpoints || []).map((e: string) => `- ${e}`).join("\n")}

## Deploy

### Replit
1. Go to [replit.com](https://replit.com)
2. Click "Create Repl" → "Import from ZIP"
3. Upload this ZIP file
4. Click "Run"

### Vercel
\`\`\`bash
npm i -g vercel
cd ${appSlug}
vercel
\`\`\`

### Railway
\`\`\`bash
npm i -g @railway/cli
cd ${appSlug}
railway up
\`\`\`

---
Built with [Svivva Seeds](https://svivva.com) — hello@svivva.com
`;

    archive.append(readme, { name: `${appSlug}/README.md` });

    const envExample = `# ${seed.appName} Environment Variables
DATABASE_URL=postgresql://user:password@localhost:5432/${appSlug}
NODE_ENV=development
PORT=3000
`;
    archive.append(envExample, { name: `${appSlug}/.env.example` });

    await archive.finalize();

    await new Promise<void>((resolve, reject) => {
      passthrough.on("end", resolve);
      passthrough.on("error", reject);
    });

    const zipBuffer = Buffer.concat(chunks);

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${appSlug}.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (error) {
    console.error("Seeds deploy error:", error);
    return NextResponse.json({ error: "Failed to generate deployment package" }, { status: 500 });
  }
}
