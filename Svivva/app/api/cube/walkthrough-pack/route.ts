import { NextRequest, NextResponse } from "next/server";
import { buildMasterProductJourney } from "@/lib/cube/cube-faces";
import { parseVisitedFacesParam } from "@/lib/cube/cube-face-progress";
import { DEFAULT_MASTER_PRODUCT_JOURNEY } from "@/lib/cube/master-product-walkthrough";
import {
  buildWalkthroughPack,
  buildWalkthroughPackZipBuffer,
  walkthroughPackZipFilename,
} from "@/lib/cube/walkthrough-pack";

export const dynamic = "force-dynamic";

function journeyFromRequest(req: NextRequest) {
  const productName =
    req.nextUrl.searchParams.get("productName")?.trim() ||
    DEFAULT_MASTER_PRODUCT_JOURNEY.productName;
  const productBrief = req.nextUrl.searchParams.get("productBrief")?.trim() || undefined;
  return buildMasterProductJourney({ productName, productBrief });
}

function packOptionsFromRequest(req: NextRequest) {
  const visited = parseVisitedFacesParam(req.nextUrl.searchParams.get("visited"));
  return visited.length ? { visitedFaceIds: visited } : {};
}

/** JSON manifest of pack files (no zip). */
export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");
  const journey = journeyFromRequest(req);
  const packOptions = packOptionsFromRequest(req);

  if (format === "zip") {
    const { buffer, filename } = await buildWalkthroughPackZipBuffer(journey, packOptions);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const pack = buildWalkthroughPack(journey, packOptions);
  return NextResponse.json({
    productName: pack.productName,
    slug: pack.slug,
    downloadZipUrl: `/api/cube/walkthrough-pack?format=zip&productName=${encodeURIComponent(journey.productName)}`,
    filename: walkthroughPackZipFilename(pack),
    fileCount: pack.files.length,
    files: pack.files.map((f) => ({ path: f.path, bytes: f.content.length })),
  });
}
