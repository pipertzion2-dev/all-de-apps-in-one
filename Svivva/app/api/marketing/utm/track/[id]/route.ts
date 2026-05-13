import { NextRequest, NextResponse } from "next/server";
import { getUtmLinkById, incrementUtmClicks, buildUtmUrl } from "@/lib/marketing/utm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const link = await getUtmLinkById(id);
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await incrementUtmClicks(id);
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
