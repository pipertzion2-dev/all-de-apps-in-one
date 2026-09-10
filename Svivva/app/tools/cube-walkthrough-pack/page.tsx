"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileArchive, Box, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { useCubeFaceProgress } from "@/hooks/use-cube-face-progress";
import { encodeVisitedFacesParam } from "@/lib/cube/cube-face-progress";
import { buildWalkthroughPackFromInput } from "@/lib/cube/walkthrough-pack";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";

const APP = getFeatureMiniApp("cube-walkthrough-pack")!;

export default function CubeWalkthroughPackPage() {
  const [productName, setProductName] = useState("Smart Soil Monitor");
  const [productBrief, setProductBrief] = useState(
    "IoT soil sensor — API, enclosure, launch SEO, brand audio, and sketch seal.",
  );
  const { isComplete, visitedCount, totalFaces, visitedSet } = useCubeFaceProgress();

  const pack = useMemo(
    () =>
      buildWalkthroughPackFromInput(
        { productName, productBrief },
        isComplete ? { visitedFaceIds: [...visitedSet] } : {},
      ),
    [productName, productBrief, isComplete, visitedSet],
  );

  const zipBase = `/api/cube/walkthrough-pack?format=zip&productName=${encodeURIComponent(productName.trim() || "Smart Soil Monitor")}${productBrief.trim() ? `&productBrief=${encodeURIComponent(productBrief.trim())}` : ""}`;
  const zipHref = isComplete
    ? `${zipBase}&visited=${encodeURIComponent(encodeVisitedFacesParam(visitedSet))}`
    : undefined;

  return (
    <MiniAppShell app={APP} nextLabel="Homepage cube">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Download a ZIP with README, JSON, markdown walkthrough, CSV checklist, route map, and
          six step files — one per cube face — for your product. Visit all six faces on the
          homepage cube first ({visitedCount}/{totalFaces} done).
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Product name</label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="My product"
              data-testid="input-product-name"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Brief (optional)</label>
            <Input
              value={productBrief}
              onChange={(e) => setProductBrief(e.target.value)}
              placeholder="One-line product description"
              data-testid="input-product-brief"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#5B8DA8]">
            <FileArchive className="w-5 h-5" />
            <span className="font-semibold">{pack.slug}-cube-walkthrough-pack.zip</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pack.files.length} files · Seeds → Digital → Hardware → Play → Orbit → Protect
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 font-mono">
            {pack.files.slice(0, 8).map((f) => (
              <li key={f.path}>{f.path}</li>
            ))}
            {pack.files.length > 8 && <li>… +{pack.files.length - 8} more</li>}
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            {isComplete && zipHref ? (
              <a href={zipHref} download>
                <Button className="gap-2 bg-[#5B8DA8]" data-testid="button-download-pack">
                  <Download className="w-4 h-4" />
                  Download pack
                </Button>
              </a>
            ) : (
              <Button className="gap-2" disabled data-testid="button-download-pack">
                <Lock className="w-4 h-4" />
                Download pack
              </Button>
            )}
            <Link href="/#nav-cube">
              <Button variant="outline" className="gap-2">
                <Box className="w-4 h-4" />
                {isComplete ? "See the cube" : "Visit cube faces"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MiniAppShell>
  );
}
