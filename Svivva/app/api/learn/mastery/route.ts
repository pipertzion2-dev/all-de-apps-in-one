import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apConceptMastery, apQuestionAttempts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { summarizeConcept } from "@/lib/ap-science/mastery";
import type { AttemptRecord } from "@/lib/ap-science/types";

export const maxDuration = 30;

/** Persist AP Science attempts when authenticated; always returns computed mastery. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      conceptId: string;
      subject?: string;
      attempts?: AttemptRecord[];
    };
    if (!body.conceptId) {
      return NextResponse.json({ error: "conceptId required" }, { status: 400 });
    }

    const session = await getSession();
    const attempts = body.attempts ?? [];
    const mastery = summarizeConcept(body.conceptId, attempts);

    if (session?.id && attempts.length > 0) {
      const last = attempts[attempts.length - 1];
      await db.insert(apQuestionAttempts).values({
        id: randomUUID(),
        userId: session.id,
        conceptId: body.conceptId,
        questionId: last.questionId,
        correct: last.correct,
        confidence: last.confidence,
        misconception: last.misconception ?? null,
        usedHint: last.usedHint,
        responseMs: last.responseMs,
      });

      const [existing] = await db
        .select()
        .from(apConceptMastery)
        .where(
          and(
            eq(apConceptMastery.userId, session.id),
            eq(apConceptMastery.conceptId, body.conceptId),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(apConceptMastery)
          .set({
            score: mastery.score,
            attempts: mastery.attempts,
            correct: mastery.correct,
            confidenceWrong: mastery.confidenceWrong,
            lastMisconception: mastery.lastMisconception ?? null,
            updatedAt: new Date(),
          })
          .where(eq(apConceptMastery.id, existing.id));
      } else {
        await db.insert(apConceptMastery).values({
          id: randomUUID(),
          userId: session.id,
          conceptId: body.conceptId,
          subject: body.subject ?? "ap-chemistry",
          score: mastery.score,
          attempts: mastery.attempts,
          correct: mastery.correct,
          confidenceWrong: mastery.confidenceWrong,
          lastMisconception: mastery.lastMisconception ?? null,
        });
      }
    }

    return NextResponse.json({ ok: true, mastery, persisted: !!session?.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ mastery: [] });
    }
    const rows = await db
      .select()
      .from(apConceptMastery)
      .where(eq(apConceptMastery.userId, session.id));
    return NextResponse.json({ mastery: rows });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
