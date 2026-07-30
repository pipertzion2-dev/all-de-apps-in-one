"use client";

import Link from "next/link";
import Image from "next/image";
import { HybridizationCalculatorPanel } from "@/components/hybridization-calculator-panel";
import { Button } from "@/components/ui/button";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";

export default function HybridizationToolPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src={svivvaLogo} alt="Svivva" width={100} height={32} className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/hybridization">
              <Button size="sm" variant="ghost">
                Full dashboard
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="px-4 py-8">
        <HybridizationCalculatorPanel />
      </main>
    </div>
  );
}
