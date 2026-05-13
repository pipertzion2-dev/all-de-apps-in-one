import { NextRequest, NextResponse } from "next/server";
import { getUtmLinkById, incrementUtmClicks, buildUtmUrl } from "@/lib/marketing/utm";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const link = await getUtmLinkById(params.id);
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await incrementUtmClicks(params.id);
    const fullUrl = buildUtmUrl({
      destinationUrl: link.destinationUrl,
      utmSource: link.utmSource,
      utmMedium: link.utmMedium,
      utmCampaign: link.utmCampaign,
      utmTerm: link.utmTerm ?? undefined,
      utmContent: link.utmContent ?? undefined,
    });
    return NextResponse.redirect(fullUrl);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
