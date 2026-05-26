import { NextRequest, NextResponse } from "next/server";
import { mockRemedy } from "@/lib/clutety/pipeline-mock";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { attack?: { hypothesis?: string } };
  return NextResponse.json(mockRemedy(body.attack ?? {}));
}
