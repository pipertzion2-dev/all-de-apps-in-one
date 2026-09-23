"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

const ADMIN_ORBIT_PATH = "/dashboard/orbit";

type Props = {
  className?: string;
  "data-testid"?: string;
};

/** Shortcut to Admin Orbit — unlock at /admin first if the owner passcode cookie is missing. */
export function OrbitAdminAccessButton({
  className,
  "data-testid": testId = "button-orbit-admin-access",
}: Props) {
  const router = useRouter();

  const { data: me, isLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
  });

  const goToAdminOrbit = () => {
    if (me?.isAdmin) {
      router.push(ADMIN_ORBIT_PATH);
      return;
    }
    const dest = `/admin?redirect=${encodeURIComponent(ADMIN_ORBIT_PATH)}`;
    router.push(dest);
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={
        className ??
        "h-8 gap-1 border-[#5B8DA8]/45 bg-background/30 px-2 text-[10px] font-bold text-foreground shadow-sm backdrop-blur-sm hover:bg-[#5B8DA8]/10 sm:gap-1.5 sm:px-3 sm:text-xs"
      }
      onClick={goToAdminOrbit}
      disabled={isLoading}
      data-testid={testId}
      aria-label="Admin Orbit"
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#5B8DA8] sm:h-4 sm:w-4" />
      <span className="hidden min-[400px]:inline">Admin Orbit</span>
    </Button>
  );
}
