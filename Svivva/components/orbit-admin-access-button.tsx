"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminCodeForm } from "@/components/admin-code-form";
import { ShieldCheck } from "lucide-react";

type Props = {
  className?: string;
  "data-testid"?: string;
};

/** Opens Orbit Admin directly when unlocked; otherwise prompts for the admin passcode. */
export function OrbitAdminAccessButton({
  className,
  "data-testid": testId = "button-orbit-admin-access",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: me } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
  });

  const goOrbitAdmin = () => {
    router.push("/dashboard/orbit");
  };

  const handleClick = () => {
    if (me?.isAdmin) {
      goOrbitAdmin();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={
          className ??
          "h-8 gap-1 border-[#5BA8A0]/45 bg-background/30 px-2 text-[10px] font-bold text-foreground shadow-sm backdrop-blur-sm hover:bg-[#5BA8A0]/10 sm:gap-1.5 sm:px-3 sm:text-xs"
        }
        onClick={handleClick}
        data-testid={testId}
        aria-label="Orbit Admin — enter admin code to unlock"
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#5BA8A0] sm:h-4 sm:w-4" />
        <span className="hidden min-[400px]:inline">Admin</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm border-border/60 bg-background/95 p-0 backdrop-blur-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Orbit Admin access</DialogTitle>
            <DialogDescription>Enter the admin passcode to open Orbit Admin.</DialogDescription>
          </DialogHeader>
          <div className="p-2">
            <AdminCodeForm
              title="Orbit Admin"
              description="Enter the 6-digit admin code to unlock Orbit Admin."
              onSuccess={() => {
                setOpen(false);
                goOrbitAdmin();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
