import { NextRequest } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http-response";
import {
  buildEducationAdvocacyCaseFile,
  protectMyEducationInputSchema,
} from "@/lib/education-advocacy/advocacy/case-file";

export async function POST(req: NextRequest) {
  try {
    const parsed = protectMyEducationInputSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid Protect My Education payload");
    const caseFile = buildEducationAdvocacyCaseFile(parsed.data);
    return ok({ caseFile });
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Case file failed");
  }
}
