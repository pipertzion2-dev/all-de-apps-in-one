"use client";

import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeatureAuthGate } from "@/hooks/use-feature-auth-gate";

type Props = {
  featureName: string;
  accentColor?: string;
};

export function FeatureSignInBanner({ featureName, accentColor = "#5BA8A0" }: Props) {
  const { isAuthenticated, isLoading, signInHref, signupHref } = useFeatureAuthGate();

  if (isLoading || isAuthenticated) return null;

  return (
    <div
      className="mx-auto max-w-4xl px-4 sm:px-6"
      data-testid="feature-sign-in-banner"
    >
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border px-4 py-3 sm:py-3.5 backdrop-blur-md"
        style={{
          borderColor: `${accentColor}45`,
          background: `linear-gradient(135deg, ${accentColor}12, transparent 70%)`,
        }}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${accentColor}22`, color: accentColor }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Explore {featureName} — sign in when you&apos;re ready to build
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Browse the workspace and 3D preview free. Create an account to save projects and deploy.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={signInHref}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </Button>
          </Link>
          <Link href={signupHref}>
            <Button
              size="sm"
              className="gap-1.5 text-xs text-white"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
            >
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
