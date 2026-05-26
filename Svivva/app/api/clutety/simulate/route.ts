import { NextRequest, NextResponse } from "next/server";
import { mockSimulate } from "@/lib/clutety/pipeline-mock";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { hypothesis?: string | { hypothesis?: string } };
  const h =
    typeof body.hypothesis === "string"
      ? body.hypothesis
      : body.hypothesis?.hypothesis || "Feed surface";
  return NextResponse.json(mockSimulate(h));
}
