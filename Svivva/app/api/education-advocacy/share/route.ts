import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { createSelectiveSharePackage, type EpvPackage } from "@/lib/education-advocacy/vault/epv";

const bodySchema = z.object({
  package: z.record(z.unknown()),
  profile: z.enum(["counselor", "legal_advocate", "scholarship", "custom"]),
  includeTimeline: z.boolean().optional(),
  includeEvidenceIds: z.array(z.string()).max(100).optional(),
  includeLegalSources: z.boolean().optional(),
  includeAdvocacy: z.boolean().optional(),
  includeAchievementsNote: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid share request");
    const pkg = parsed.data.package as unknown as EpvPackage;
    if (!pkg?.vaultId || !pkg?.protocol) return badRequest("Not an EPV package");
    const shared = createSelectiveSharePackage(pkg, {
      profile: parsed.data.profile,
      includeTimeline: parsed.data.includeTimeline,
      includeEvidenceIds: parsed.data.includeEvidenceIds,
      includeLegalSources: parsed.data.includeLegalSources,
      includeAdvocacy: parsed.data.includeAdvocacy,
      includeAchievementsNote: parsed.data.includeAchievementsNote,
    });
    return ok(shared);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Share failed");
  }
}
