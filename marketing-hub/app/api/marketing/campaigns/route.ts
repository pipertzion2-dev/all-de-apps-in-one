import { NextRequest, NextResponse } from "next/server";
import {
  getCampaigns,
  createCampaign,
  getCampaignSummary,
  updateCampaignStatus,
} from "@/lib/marketing/campaigns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get("summary");
    if (summary === "true") {
      const data = await getCampaignSummary();
      return NextResponse.json(data);
    }
    const campaigns = await getCampaigns();
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, channel, budget, targetAudience, startDate, endDate, goals, tags } =
      body;
    if (!name || !channel) {
      return NextResponse.json({ error: "name and channel are required" }, { status: 400 });
    }
    const campaign = await createCampaign({
      name,
      description,
      channel,
      budget,
      targetAudience,
      startDate,
      endDate,
      goals,
      tags,
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }
    const campaign = await updateCampaignStatus(id, status);
    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}
