import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { growthContent, growthSubmissions } from "@/lib/schema";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { generateSubmissionFields } from "@/lib/orbit/submission-ai";
import {
  SUBMISSION_ITEMS,
  formatFieldsForClipboard,
  getSubmissionItem,
  type SubmissionItemDef,
} from "@/lib/orbit/submission-schemas";

export const maxDuration = 120;

const PRODUCT = "svivva";

type StoredPayload = {
  fields: Record<string, string>;
  aiFilledAt?: string;
  updatedAt?: string;
};

function storageKey(item: SubmissionItemDef): string {
  return item.directoryId ?? item.id;
}

function parseNotes(notes: string | null): StoredPayload | null {
  if (!notes) return null;
  try {
    const j = JSON.parse(notes) as StoredPayload;
    if (j.fields && typeof j.fields === "object") return j;
  } catch {
    /* legacy plain text notes */
    return { fields: { longDescription: notes } };
  }
  return null;
}

async function loadItemState(item: SubmissionItemDef) {
  const key = storageKey(item);
  const [row] = await db
    .select()
    .from(growthSubmissions)
    .where(and(eq(growthSubmissions.directoryId, key), eq(growthSubmissions.product, PRODUCT)))
    .limit(1);

  const payload = parseNotes(row?.notes ?? null);
  return {
    item,
    status: (row?.status ?? "pending") as "pending" | "submitted" | "live" | "rejected",
    liveUrl: row?.liveUrl ?? null,
    submittedAt: row?.submittedAt?.toISOString() ?? null,
    fields: payload?.fields ?? {},
    aiFilledAt: payload?.aiFilledAt ?? null,
  };
}

/** Pull latest autopilot / growth content to pre-fill publish items */
async function loadContentHints(): Promise<Record<string, Record<string, string>>> {
  const rows = await db
    .select()
    .from(growthContent)
    .where(eq(growthContent.product, PRODUCT))
    .limit(80);

  const hints: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    const t = row.contentType;
    if (t === "parasite-devto") {
      hints["pub-devto"] = { title: row.title || "", body: row.content };
    } else if (t === "parasite-medium") {
      hints["pub-medium"] = { title: row.title || "", body: row.content };
    } else if (t === "parasite-hashnode") {
      hints["pub-hashnode"] = { title: row.title || "", body: row.content };
    } else if (t === "social-twitter") {
      hints["pub-twitter"] = { thread: row.content };
    } else if (t === "social-linkedin") {
      hints["pub-linkedin"] = { headline: row.title || "", body: row.content };
    } else if (t === "show-hn") {
      const lines = row.content.split("\n");
      hints["pub-showhn"] = { title: lines[0] || "", body: lines.slice(1).join("\n") };
    } else if (t === "product-hunt") {
      hints["pub-producthunt"] = { description: row.content };
    } else if (t.startsWith("reddit-")) {
      hints["pub-reddit"] = { title: row.title || "", body: row.content };
    } else if (t === "outreach-newsletter") {
      hints["pub-newsletter"] = { subject: row.title || "", body: row.content };
    } else if (t === "outreach-podcast") {
      hints["pub-podcast"] = { subject: row.title || "", body: row.content };
    }
  }
  return hints;
}

async function saveFields(item: SubmissionItemDef, fields: Record<string, string>) {
  const key = storageKey(item);
  const aiFilledAt = fields._aiFilledAt;
  const clean = { ...fields };
  delete clean._aiFilledAt;
  const payload: StoredPayload = {
    fields: clean,
    updatedAt: new Date().toISOString(),
    aiFilledAt: aiFilledAt || undefined,
  };
  const notes = JSON.stringify(payload);

  const [existing] = await db
    .select({ id: growthSubmissions.id })
    .from(growthSubmissions)
    .where(and(eq(growthSubmissions.directoryId, key), eq(growthSubmissions.product, PRODUCT)))
    .limit(1);

  if (existing) {
    await db.update(growthSubmissions).set({ notes }).where(eq(growthSubmissions.id, existing.id));
  } else {
    await db.insert(growthSubmissions).values({
      directoryId: key,
      product: PRODUCT,
      status: "pending",
      notes,
    });
  }
}

export async function GET(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const kind = req.nextUrl.searchParams.get("kind");
  const hints = await loadContentHints();

  let items = SUBMISSION_ITEMS;
  if (kind === "directory" || kind === "publish" || kind === "account") {
    items = items.filter((i) => i.kind === kind);
  }

  const states = await Promise.all(
    items.map(async (item) => {
      const state = await loadItemState(item);
      const hint = hints[item.id];
      if (hint && Object.keys(state.fields).length === 0) {
        state.fields = hint;
      }
      return state;
    }),
  );

  const submitted = states.filter((s) => s.status !== "pending").length;
  const live = states.filter((s) => s.status === "live").length;

  return NextResponse.json({
    items: states,
    stats: { total: states.length, submitted, live, pending: states.length - submitted },
  });
}

export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const action = body.action as string;

  if (action === "save") {
    const item = getSubmissionItem(body.itemId);
    if (!item) return NextResponse.json({ error: "Unknown item" }, { status: 400 });
    await saveFields(item, body.fields || {});
    return NextResponse.json({ ok: true });
  }

  if (action === "ai_fill") {
    const item = getSubmissionItem(body.itemId);
    if (!item) return NextResponse.json({ error: "Unknown item" }, { status: 400 });
    const fields = await generateSubmissionFields(item);
    fields._aiFilledAt = new Date().toISOString();
    await saveFields(item, fields);
    return NextResponse.json({
      ok: true,
      fields,
      clipboard: formatFieldsForClipboard(item, fields),
    });
  }

  if (action === "ai_fill_all") {
    const kind = body.kind as "directory" | "publish" | "account" | undefined;
    const targets = kind ? SUBMISSION_ITEMS.filter((i) => i.kind === kind) : SUBMISSION_ITEMS;
    const results: { id: string; ok: boolean }[] = [];
    for (const item of targets) {
      try {
        const fields = await generateSubmissionFields(item);
        fields._aiFilledAt = new Date().toISOString();
        await saveFields(item, fields);
        results.push({ id: item.id, ok: true });
      } catch {
        results.push({ id: item.id, ok: false });
      }
    }
    return NextResponse.json({ ok: true, results, filled: results.filter((r) => r.ok).length });
  }

  if (action === "mark_status") {
    const item = getSubmissionItem(body.itemId);
    if (!item) return NextResponse.json({ error: "Unknown item" }, { status: 400 });
    const status = body.status as "pending" | "submitted" | "live" | "rejected";
    const key = storageKey(item);

    const [existing] = await db
      .select({ id: growthSubmissions.id, notes: growthSubmissions.notes })
      .from(growthSubmissions)
      .where(and(eq(growthSubmissions.directoryId, key), eq(growthSubmissions.product, PRODUCT)))
      .limit(1);

    if (existing) {
      await db
        .update(growthSubmissions)
        .set({
          status,
          liveUrl: body.liveUrl || null,
          submittedAt: status !== "pending" ? new Date() : null,
        })
        .where(eq(growthSubmissions.id, existing.id));
    } else {
      await db.insert(growthSubmissions).values({
        directoryId: key,
        product: PRODUCT,
        status,
        liveUrl: body.liveUrl || null,
        submittedAt: status !== "pending" ? new Date() : null,
        notes: JSON.stringify({ fields: body.fields || {} }),
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "clipboard") {
    const item = getSubmissionItem(body.itemId);
    if (!item) return NextResponse.json({ error: "Unknown item" }, { status: 400 });
    const state = await loadItemState(item);
    const fields = body.fields || state.fields;
    return NextResponse.json({
      text: formatFieldsForClipboard(item, fields),
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
