"use client";

import { useAuth, authFetch } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Shield, Trash2, KeyRound } from "lucide-react";
import { OrbitStripeSetup } from "@/components/orbit-stripe-setup";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: me } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => authFetch("/api/auth/me").then((r) => r.json()),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-lg">
                {user?.firstName?.[0] || user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User"}
              </h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                defaultValue={user?.firstName || ""}
                disabled
                data-testid="input-first-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                defaultValue={user?.lastName || ""}
                disabled
                data-testid="input-last-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={user?.email || ""}
                disabled
                data-testid="input-email"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Profile information is managed through your Replit account.
          </p>
        </CardContent>
      </Card>

      {me?.isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Runtime credentials
              </CardTitle>
              <CardDescription>
                Save OpenAI, Stripe, and site URL in the database when you prefer not to use host
                env vars.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/dashboard/settings/runtime-keys">Manage API keys in app</Link>
              </Button>
            </CardContent>
          </Card>

          <OrbitStripeSetup />
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground">Managed through your Replit account</p>
            </div>
            <Button variant="outline" disabled data-testid="button-2fa">
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" data-testid="button-delete-account">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
