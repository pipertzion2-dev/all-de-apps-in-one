"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { FEATURES } from "@/components/svivva-artifact/feature-defs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { platformModeForCubeFace, usePlatform } from "@/lib/platform-context";
import {
  PRODUCT_TYPE_TEMPLATES,
  buildProductTypeJourney,
  type ProductTypeTemplate,
} from "@/lib/cube/product-type-journeys";
import { useCubeFaceProgress } from "@/hooks/use-cube-face-progress";

function faceAccent(faceId: FeatureId): string {
  return FEATURES.find((f) => f.id === faceId)?.accentColor ?? "#5B8DA8";
}

export function ProductTypePicker() {
  const router = useRouter();
  const { setMode } = usePlatform();
  const { recordVisit } = useCubeFaceProgress();

  const [selectedId, setSelectedId] = useState<string>("fashion");
  const [productName, setProductName] = useState("");
  const [optionalEnabled, setOptionalEnabled] = useState<Record<string, boolean>>({});

  const template = useMemo(
    () => PRODUCT_TYPE_TEMPLATES.find((t) => t.id === selectedId) ?? PRODUCT_TYPE_TEMPLATES[0],
    [selectedId],
  );

  const enabledOptional = useMemo(() => {
    const ids: FeatureId[] = [];
    for (const opt of template.optionalSteps ?? []) {
      if (optionalEnabled[opt.faceId]) ids.push(opt.faceId);
    }
    return ids;
  }, [template, optionalEnabled]);

  const journey = useMemo(
    () =>
      buildProductTypeJourney(template, {
        productName: productName.trim() || undefined,
        enabledOptionalFaceIds: enabledOptional,
      }),
    [template, productName, enabledOptional],
  );

  const selectTemplate = useCallback((t: ProductTypeTemplate) => {
    setSelectedId(t.id);
    setProductName("");
    setOptionalEnabled({});
  }, []);

  const openFace = useCallback(
    (faceId: FeatureId, href: string) => {
      recordVisit(faceId);
      const busMode = platformModeForCubeFace(faceId);
      if (busMode) setMode(busMode);
      router.push(href);
      window.scrollTo(0, 0);
    },
    [recordVisit, router, setMode],
  );

  const startPath = useCallback(() => {
    const first = journey.steps[0];
    if (first) openFace(first.faceId, first.href);
  }, [journey.steps, openFace]);

  return (
    <div
      className="mt-8 w-full max-w-xl relative z-20 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-4"
      data-testid="product-type-picker"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[#5B8DA8] shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-semibold">What are you making?</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pick a product type — we&apos;ll map the right cube faces in order. Fashion might start
            with Protect, then Hardware, then Digital if it lights up.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="listbox" aria-label="Product type">
        {PRODUCT_TYPE_TEMPLATES.map((t) => {
          const active = t.id === selectedId;
          return (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => selectTemplate(t)}
              className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                active
                  ? "border-[#5B8DA8] bg-[#5B8DA8]/15 text-foreground"
                  : "border-border/60 bg-background/60 text-muted-foreground hover:border-[#5B8DA8]/40"
              }`}
              data-testid={`product-type-${t.id}`}
            >
              <span className="mr-1" aria-hidden>
                {t.emoji}
              </span>
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <label htmlFor="product-type-name" className="text-xs text-muted-foreground">
          Product name (optional)
        </label>
        <Input
          id="product-type-name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder={template.exampleProduct}
          className="h-9 text-sm bg-background/80"
        />
      </div>

      {(template.optionalSteps?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Add-on paths</p>
          {template.optionalSteps!.map((opt) => {
            const face = FEATURES.find((f) => f.id === opt.faceId);
            return (
              <label
                key={opt.faceId}
                className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-2 cursor-pointer hover:border-[#5B8DA8]/40"
              >
                <input
                  type="checkbox"
                  checked={Boolean(optionalEnabled[opt.faceId])}
                  onChange={(e) =>
                    setOptionalEnabled((prev) => ({ ...prev, [opt.faceId]: e.target.checked }))
                  }
                  className="mt-0.5"
                />
                <span className="text-xs leading-relaxed">
                  <span className="font-medium text-foreground">{face?.shortLabel ?? opt.faceId}</span>
                  {" — "}
                  {opt.when}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{journey.productBrief}</p>
        <ol className="space-y-2" data-testid="product-type-path">
          {journey.steps.map((step) => (
            <li key={step.faceId}>
              <button
                type="button"
                onClick={() => openFace(step.faceId, step.href)}
                className="w-full flex items-start gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2.5 text-left hover:border-[#5B8DA8]/50 transition-colors group"
                data-testid={`product-type-step-${step.faceId}`}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-mono font-bold text-white"
                  style={{ backgroundColor: faceAccent(step.faceId) }}
                >
                  {step.step}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium group-hover:text-[#5B8DA8]">
                    {step.shortLabel} — {step.name}
                  </span>
                  <span className="block text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {step.action}
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-[#5B8DA8] mt-1" />
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" className="gap-2 bg-[#5B8DA8]" onClick={startPath} data-testid="product-type-start">
          Start step 1
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
        <Link
          href={`/tools/cube-walkthrough-pack?productName=${encodeURIComponent(journey.productName)}`}
        >
          <Button size="sm" variant="outline">
            Download full pack
          </Button>
        </Link>
      </div>
    </div>
  );
}
