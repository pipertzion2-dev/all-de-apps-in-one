"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";

const APP = getFeatureMiniApp("homepage-flip-guide")!;

export default function HomepageFlipGuidePage() {
  const [face, setFace] = useState<"game" | "home">("game");

  return (
    <MiniAppShell app={APP} nextLabel="Live homepage">
      <div className="flex justify-center gap-2">
        <Button
          type="button"
          variant={face === "game" ? "default" : "outline"}
          className={face === "game" ? "bg-[#5B8DA8]" : ""}
          onClick={() => setFace("game")}
        >
          Game face
        </Button>
        <Button
          type="button"
          variant={face === "home" ? "default" : "outline"}
          className={face === "home" ? "bg-[#5B8DA8]" : ""}
          onClick={() => setFace("home")}
        >
          Home face
        </Button>
      </div>

      <div
        className="relative mx-auto h-64 max-w-md perspective-[900px]"
        data-testid="flip-demo"
      >
        <div
          className="relative h-full w-full transition-transform duration-700 preserve-3d"
          style={{
            transformStyle: "preserve-3d",
            transform: face === "home" ? "rotateX(180deg)" : "rotateX(0deg)",
          }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[#7EC8D9]/40 bg-[#0a0c10] p-6 backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[#7EC8D9]">Face 1</p>
            <p className="mt-2 text-xl font-bold text-white">Klean Sneaks</p>
            <p className="mt-2 text-center text-sm text-white/60">
              Play first. Swipe or scroll down when you are ready to flip.
            </p>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[#D94F9C]/30 bg-[#0a0c10] p-6"
            style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[#D94F9C]">Face 2</p>
            <p className="mt-2 text-xl font-bold text-white">About · Pricing</p>
            <p className="mt-2 text-center text-sm text-white/60">
              Scroll about and plans on the back face. Flip up to return to the game.
            </p>
          </div>
        </div>
      </div>

      <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
        <li>On mobile, use one continuous scroll — no cut-off pricing block.</li>
        <li>Flip hints stay near the game, not over pricing copy.</li>
        <li>This card flip is a sketch; production uses the full flip stack on zzaizzai.com.</li>
      </ul>

      <Link href="/#clean-sneaks">
        <Button className="gap-2 bg-[#5B8DA8]">
          <Home className="w-4 h-4" />
          Open live homepage
        </Button>
      </Link>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <ArrowDown className="w-3 h-3" /> Scroll on the site to flip for real
      </p>
    </MiniAppShell>
  );
}
