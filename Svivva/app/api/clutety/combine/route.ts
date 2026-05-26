import { NextRequest, NextResponse } from "next/server";
import { mockCombine } from "@/lib/clutety/pipeline-mock";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { system?: string };
  const system =
    typeof body.system === "string" ? body.system : JSON.stringify(body.system ?? "target");
  return NextResponse.json(mockCombine(system));
}
