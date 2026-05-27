import { NextRequest, NextResponse } from "next/server";
import { getLeads, captureLead, updateLeadStatus, getLeadStats } from "@/lib/marketing/leads";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const stats = searchParams.get("stats");
    if (stats === "true") {
      const data = await getLeadStats();
      return NextResponse.json(data);
    }
    const leads = await getLeads(search);
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    const lead = await captureLead(body);
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to capture lead" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status)
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    const lead = await updateLeadStatus(id, status);
    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
