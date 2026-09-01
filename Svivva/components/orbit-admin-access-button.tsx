"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

type Props = {
  className?: string;
  "data-testid"?: string;
};

/** Owner-only shortcut to Orbit Admin — hidden until admin passcode is set. */
export function OrbitAdminAccessButton({
  className,
  "data-testid": testId = "button-orbit-admin-access",
}: Props) {
  const router = useRouter();

  const { data: me } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
  });

  if (!me?.isAdmin) {
    return null;
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={
        className ??
        "h-8 gap-1 border-[#5B8DA8]/45 bg-background/30 px-2 text-[10px] font-bold text-foreground shadow-sm backdrop-blur-sm hover:bg-[#5B8DA8]/10 sm:gap-1.5 sm:px-3 sm:text-xs"
      }
      onClick={() => router.push("/dashboard/orbit")}
      data-testid={testId}
      aria-label="Orbit Admin"
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#5B8DA8] sm:h-4 sm:w-4" />
      <span className="hidden min-[400px]:inline">Admin</span>
    </Button>
  );
}
