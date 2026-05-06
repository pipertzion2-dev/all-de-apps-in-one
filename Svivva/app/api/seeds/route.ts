import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedSessions, seeds, seoLandingPages } from "@/lib/schema";
import { parsePdfToSeeds, generateEngineeringDocs, generateMarketingContent, generateCodeScaffold, applyPromptToSeed, generateSeedMarketingPages } from "@/lib/llm/seeds";
import { eq, desc, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth/session";
import { getSitemapUrl } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db
      .select()
      .from(seedSessions)
      .where(eq(seedSessions.userId, user.id))
      .orderBy(desc(seedSessions.createdAt))
      .limit(20);

    const allSeeds = [];
    for (const session of sessions) {
      const sessionSeeds = await db
        .select()
        .from(seeds)
        .where(eq(seeds.sessionId, session.id))
        .orderBy(desc(seeds.createdAt));
      allSeeds.push(...sessionSeeds);
    }

    const seedIds = allSeeds.map((s) => s.id);
    let marketingPagesBySeed: Record<string, string[]> = {};
    if (seedIds.length > 0) {
      const pages = await db
        .select({ slug: seoLandingPages.slug, toolUrl: seoLandingPages.toolUrl })
        .from(seoLandingPages)
        .where(inArray(seoLandingPages.toolUrl, seedIds));
      for (const p of pages) {
        if (p.toolUrl) {
          marketingPagesBySeed[p.toolUrl] = marketingPagesBySeed[p.toolUrl] || [];
          marketingPagesBySeed[p.toolUrl].push(p.slug);
        }
      }
    }

    return NextResponse.json({ sessions, seeds: allSeeds, marketingPagesBySeed });
  } catch (error) {
    console.error("Seeds GET error:", error);
    return NextResponse.json({ error: "Failed to fetch seeds" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("pdf") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
      }

      if (!file.name.endsWith(".pdf") && file.type !== "application/pdf") {
        return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
      }

      const sessionId = uuidv4();

      await db.insert(seedSessions).values({
        id: sessionId,
        userId: user.id,
        fileName: file.name,
        status: "parsing",
        seedCount: 0,
      });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let pdfText = "";
      try {
        const pdfParseModule = await import("pdf-parse");
        const pdfParse = (pdfParseModule as any).default || pdfParseModule;
        const parsed = await pdfParse(buffer);
        pdfText = parsed.text;
      } catch {
        pdfText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
      }

      if (!pdfText.trim()) {
        await db.update(seedSessions).set({ status: "error" }).where(eq(seedSessions.id, sessionId));
        return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
      }

      const result = await parsePdfToSeeds(pdfText);

      if (!result.success || result.seeds.length === 0) {
        await db.update(seedSessions).set({ status: "error" }).where(eq(seedSessions.id, sessionId));
        return NextResponse.json({ error: result.error || "No application specs found in PDF" }, { status: 400 });
      }

      const seedRecords = result.seeds.map((spec) => ({
        id: uuidv4(),
        sessionId,
        appName: spec.appName,
        spec,
        status: "parsed",
        buildProgress: 0,
      }));

      for (const record of seedRecords) {
        await db.insert(seeds).values(record);
      }

      await db.update(seedSessions).set({
        status: "parsed",
        seedCount: seedRecords.length,
      }).where(eq(seedSessions.id, sessionId));

      return NextResponse.json({
        sessionId,
        seedCount: seedRecords.length,
        seeds: seedRecords.map((r) => ({ id: r.id, appName: r.appName, status: r.status })),
      });
    }

    const body = await request.json();
    const { action, seedId } = body;

    if (action === "build" && seedId) {
      const [seed] = await db.select().from(seeds).where(eq(seeds.id, seedId));
      if (!seed) {
        return NextResponse.json({ error: "Seed not found" }, { status: 404 });
      }

      const [ownerSession] = await db.select().from(seedSessions).where(eq(seedSessions.id, seed.sessionId));
      if (!ownerSession || ownerSession.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      await db.update(seeds).set({ status: "building", buildProgress: 10 }).where(eq(seeds.id, seedId));

      const [docsResult, marketingResult, codeResult] = await Promise.all([
        generateEngineeringDocs(seed.spec).then(async (r) => {
          await db.update(seeds).set({ buildProgress: 40 }).where(eq(seeds.id, seedId));
          return r;
        }),
        generateMarketingContent(seed.spec).then(async (r) => {
          await db.update(seeds).set({ buildProgress: 70 }).where(eq(seeds.id, seedId));
          return r;
        }),
        generateCodeScaffold(seed.spec).then(async (r) => {
          await db.update(seeds).set({ buildProgress: 95 }).where(eq(seeds.id, seedId));
          return r;
        }),
      ]);

      const hasError = !docsResult.success || !marketingResult.success || !codeResult.success;
      const errorMessages = [
        docsResult.error,
        marketingResult.error,
        codeResult.error,
      ].filter(Boolean).join("; ");

      await db.update(seeds).set({
        status: hasError ? "partial" : "complete",
        buildProgress: 100,
        engineeringDocs: docsResult.docs,
        marketingContent: marketingResult.content,
        generatedCode: codeResult.code,
        error: errorMessages || null,
      }).where(eq(seeds.id, seedId));

      return NextResponse.json({
        success: true,
        status: hasError ? "partial" : "complete",
        seedId,
      });
    }

    if (action === "build-all" && body.sessionId) {
      const [ownerSession] = await db.select().from(seedSessions).where(eq(seedSessions.id, body.sessionId));
      if (!ownerSession || ownerSession.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const sessionSeeds = await db.select().from(seeds).where(eq(seeds.sessionId, body.sessionId));

      for (const seed of sessionSeeds) {
        if (seed.status === "parsed") {
          await db.update(seeds).set({ status: "queued" }).where(eq(seeds.id, seed.id));
        }
      }

      const buildPromises = sessionSeeds
        .filter((s) => s.status === "parsed" || s.status === "queued")
        .map(async (seed) => {
          await db.update(seeds).set({ status: "building", buildProgress: 10 }).where(eq(seeds.id, seed.id));

          try {
            const [docsResult, marketingResult, codeResult] = await Promise.all([
              generateEngineeringDocs(seed.spec),
              generateMarketingContent(seed.spec),
              generateCodeScaffold(seed.spec),
            ]);

            const hasError = !docsResult.success || !marketingResult.success || !codeResult.success;

            await db.update(seeds).set({
              status: hasError ? "partial" : "complete",
              buildProgress: 100,
              engineeringDocs: docsResult.docs,
              marketingContent: marketingResult.content,
              generatedCode: codeResult.code,
              error: [docsResult.error, marketingResult.error, codeResult.error].filter(Boolean).join("; ") || null,
            }).where(eq(seeds.id, seed.id));
          } catch (err) {
            await db.update(seeds).set({
              status: "error",
              error: String(err),
            }).where(eq(seeds.id, seed.id));
          }
        });

      await Promise.all(buildPromises);

      return NextResponse.json({ success: true, built: sessionSeeds.length });
    }

    if (action === "generate-pages") {
      const targetSeedIds: string[] = body.seedIds || (body.sessionId ? (await db.select({ id: seeds.id }).from(seeds).where(eq(seeds.sessionId, body.sessionId))).map((r) => r.id) : []);

      if (targetSeedIds.length === 0) {
        return NextResponse.json({ error: "No seeds specified" }, { status: 400 });
      }

      const validSeeds = [];
      for (const sid of targetSeedIds) {
        const [seed] = await db.select().from(seeds).where(eq(seeds.id, sid));
        if (!seed) continue;
        const [ownerSession] = await db.select().from(seedSessions).where(eq(seedSessions.id, seed.sessionId));
        if (ownerSession && ownerSession.userId === user.id) validSeeds.push(seed);
      }

      if (validSeeds.length === 0) {
        return NextResponse.json({ error: "No valid seeds found" }, { status: 404 });
      }

      const results = await Promise.all(
        validSeeds.map(async (seed) => {
          try {
            const result = await generateSeedMarketingPages(seed.spec, seed.id);
            if (!result.success || result.pages.length === 0) {
              return { seedId: seed.id, success: false, slugs: [], error: result.error };
            }

            const inserted = [];
            for (const page of result.pages) {
              const existing = await db.select({ id: seoLandingPages.id }).from(seoLandingPages).where(eq(seoLandingPages.slug, page.slug)).limit(1);
              if (existing.length > 0) continue;
              const [row] = await db.insert(seoLandingPages).values({
                slug: page.slug,
                keyword: page.keyword,
                title: page.title,
                headline: page.headline,
                subheadline: page.subheadline,
                content: page.content,
                benefits: page.benefits,
                howItWorks: page.howItWorks,
                whoItsFor: page.whoItsFor,
                metaTitle: page.metaTitle,
                metaDescription: page.metaDescription,
                published: true,
                category: "seed-marketing",
                toolUrl: seed.id,
              }).returning({ slug: seoLandingPages.slug });
              if (row) inserted.push(row.slug);
            }

            return { seedId: seed.id, success: true, slugs: inserted };
          } catch (err) {
            return { seedId: seed.id, success: false, slugs: [], error: String(err) };
          }
        })
      );

      try {
        await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(getSitemapUrl())}`, { method: "GET", signal: AbortSignal.timeout(3000) });
      } catch { /* Non-critical */ }

      return NextResponse.json({
        success: true,
        results,
        totalPages: results.reduce((acc, r) => acc + r.slugs.length, 0),
      });
    }

    if (action === "prompt-multi" && body.seedIds && body.prompt) {
      const seedIds: string[] = body.seedIds;
      const prompt: string = body.prompt;

      if (!Array.isArray(seedIds) || seedIds.length === 0 || typeof prompt !== "string" || !prompt.trim()) {
        return NextResponse.json({ error: "seedIds (array) and prompt (string) are required" }, { status: 400 });
      }

      if (seedIds.length > 20) {
        return NextResponse.json({ error: "Maximum 20 seeds per batch prompt" }, { status: 400 });
      }

      const targetSeeds = [];
      for (const sid of seedIds) {
        const [seed] = await db.select().from(seeds).where(eq(seeds.id, sid));
        if (!seed) continue;
        const [ownerSession] = await db.select().from(seedSessions).where(eq(seedSessions.id, seed.sessionId));
        if (ownerSession && ownerSession.userId === user.id) {
          targetSeeds.push(seed);
        }
      }

      if (targetSeeds.length === 0) {
        return NextResponse.json({ error: "No valid seeds found" }, { status: 404 });
      }

      for (const seed of targetSeeds) {
        await db.update(seeds).set({ status: "building", buildProgress: 10 }).where(eq(seeds.id, seed.id));
      }

      const results = await Promise.all(
        targetSeeds.map(async (seed) => {
          try {
            await db.update(seeds).set({ buildProgress: 30 }).where(eq(seeds.id, seed.id));
            const result = await applyPromptToSeed(seed.spec, prompt);
            if (result.success && result.spec) {
              await db.update(seeds).set({
                spec: result.spec,
                appName: result.spec.appName,
                status: "parsed",
                buildProgress: 0,
                engineeringDocs: null,
                marketingContent: null,
                generatedCode: null,
                error: null,
              }).where(eq(seeds.id, seed.id));
              return { seedId: seed.id, success: true };
            } else {
              await db.update(seeds).set({
                status: "error",
                buildProgress: 0,
                error: result.error || "Failed to apply prompt",
              }).where(eq(seeds.id, seed.id));
              return { seedId: seed.id, success: false, error: result.error };
            }
          } catch (err) {
            await db.update(seeds).set({
              status: "error",
              buildProgress: 0,
              error: String(err),
            }).where(eq(seeds.id, seed.id));
            return { seedId: seed.id, success: false, error: String(err) };
          }
        })
      );

      return NextResponse.json({
        success: true,
        results,
        applied: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        skipped: seedIds.length - targetSeeds.length,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Seeds POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
