import { NextRequest, NextResponse } from "next/server";
import { createUtmLink, getUtmLinks, buildUtmUrl } from "@/lib/marketing/utm";

export async function GET() {
  try {
    return NextResponse.json(await getUtmLinks());
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch UTM links" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, destinationUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, campaignId } = body;
    if (!name || !destinationUrl || !utmSource || !utmMedium || !utmCampaign) {
      return NextResponse.json({ error: "name, destinationUrl, utmSource, utmMedium, utmCampaign are required" }, { status: 400 });
    }
    const link = await createUtmLink({ name, destinationUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, campaignId });
    const fullUrl = buildUtmUrl({ destinationUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent });
    return NextResponse.json({ ...link, fullUrl }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create UTM link" }, { status: 500 });
  }
}
