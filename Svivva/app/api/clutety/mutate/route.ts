import { NextResponse } from "next/server";
import { mockMutate } from "@/lib/clutety/pipeline-mock";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(mockMutate());
}
