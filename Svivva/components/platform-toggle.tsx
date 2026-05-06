"use client";

import { usePlatform } from "@/lib/platform-context";
import { Button } from "@/components/ui/button";
import { Monitor, Wrench } from "lucide-react";
import Image from "next/image";
import softwareFlowerLogo from "@/attached_assets/Svivva_print_2_1769474625495.png";
import hardwareFlowerLogo from "@/attached_assets/Svivva_official_3_1769474625495.png";

export function PlatformToggle() {
  const { mode, toggleMode } = usePlatform();

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-border">
        <Image
          src={mode === "digital" ? hardwareFlowerLogo : softwareFlowerLogo}
          alt={mode === "digital" ? "Digital Mode" : "Physical Mode"}
          fill
          sizes="32px"
          className="object-cover"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={toggleMode}
        className="gap-2 text-xs"
        data-testid="button-platform-toggle"
      >
        {mode === "digital" ? (
          <>
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Digital</span>
          </>
        ) : (
          <>
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Physical</span>
          </>
        )}
      </Button>
    </div>
  );
}
