"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPiggyBank } from "@/components/admin-piggy-bank";
import { ArrowLeft, Users } from "lucide-react";

export default function PiggyBankPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Piggy Bank</h1>
          <p className="text-sm text-muted-foreground">
            Track what the app has made — works with or without Stripe.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin">
              <Users className="h-4 w-4 mr-2" />
              Admin overview
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <AdminPiggyBank />
    </div>
  );
}
