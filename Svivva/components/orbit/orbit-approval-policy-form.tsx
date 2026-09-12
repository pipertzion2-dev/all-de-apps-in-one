"use client";

import { useEffect, useState } from "react";
import type { OrbitApprovalPolicy, OrbitContentPlatform } from "@/lib/orbit/graph-constants";
import { ORBIT_CONTENT_PLATFORMS } from "@/lib/orbit/graph-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type Props = {
  policy: OrbitApprovalPolicy;
  onChange: (policy: OrbitApprovalPolicy) => void;
  onSave?: () => void;
  saving?: boolean;
  readOnly?: boolean;
};

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToLines(list?: string[]): string {
  return (list || []).join("\n");
}

export function OrbitApprovalPolicyForm({ policy, onChange, onSave, saving, readOnly }: Props) {
  const [local, setLocal] = useState<OrbitApprovalPolicy>(policy);

  useEffect(() => {
    setLocal(policy);
  }, [policy]);

  function patch(partial: Partial<OrbitApprovalPolicy>) {
    const next = { ...local, ...partial };
    setLocal(next);
    onChange(next);
  }

  function togglePlatform(platform: OrbitContentPlatform) {
    const current = new Set(local.allowedPlatforms || []);
    if (current.has(platform)) current.delete(platform);
    else current.add(platform);
    patch({ allowedPlatforms: [...current] as OrbitContentPlatform[] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label htmlFor="require-approval">Require approval before publish</Label>
          <p className="text-sm text-muted-foreground">
            When enabled, assets must be approved before distribution jobs run.
          </p>
        </div>
        <Switch
          id="require-approval"
          checked={local.requireApprovalForPublish !== false}
          disabled={readOnly}
          onCheckedChange={(checked) => patch({ requireApprovalForPublish: checked })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="max-day">Max posts per day</Label>
          <Input
            id="max-day"
            type="number"
            min={0}
            disabled={readOnly}
            value={local.maxPostsPerDay ?? ""}
            onChange={(e) =>
              patch({ maxPostsPerDay: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-week">Max posts per week</Label>
          <Input
            id="max-week"
            type="number"
            min={0}
            disabled={readOnly}
            value={local.maxPostsPerWeek ?? ""}
            onChange={(e) =>
              patch({ maxPostsPerWeek: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quiet-start">Quiet hours start (HH:MM)</Label>
          <Input
            id="quiet-start"
            placeholder="22:00"
            disabled={readOnly}
            value={local.quietHoursStart ?? ""}
            onChange={(e) => patch({ quietHoursStart: e.target.value || undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quiet-end">Quiet hours end (HH:MM)</Label>
          <Input
            id="quiet-end"
            placeholder="07:00"
            disabled={readOnly}
            value={local.quietHoursEnd ?? ""}
            onChange={(e) => patch({ quietHoursEnd: e.target.value || undefined })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Allowed platforms (empty = all)</Label>
        <div className="flex flex-wrap gap-2">
          {ORBIT_CONTENT_PLATFORMS.map((platform) => {
            const active = local.allowedPlatforms?.includes(platform);
            return (
              <Badge
                key={platform}
                variant={active ? "default" : "outline"}
                className={readOnly ? "" : "cursor-pointer"}
                onClick={() => !readOnly && togglePlatform(platform)}
              >
                {platform}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content-types">Allowed content types (one per line)</Label>
        <Textarea
          id="content-types"
          rows={3}
          disabled={readOnly}
          placeholder="social_post&#10;blog_post&#10;landing_page"
          value={listToLines(local.allowedContentTypes)}
          onChange={(e) => patch({ allowedContentTypes: linesToList(e.target.value) })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="blocked">Blocked terms (one per line)</Label>
        <Textarea
          id="blocked"
          rows={3}
          disabled={readOnly}
          placeholder="guaranteed returns&#10;get rich quick"
          value={listToLines(local.blockedTerms)}
          onChange={(e) => patch({ blockedTerms: linesToList(e.target.value) })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="disclaimers">Required disclaimers (must appear in body)</Label>
        <Textarea
          id="disclaimers"
          rows={3}
          disabled={readOnly}
          placeholder="Not financial advice"
          value={listToLines(local.requiredDisclaimers)}
          onChange={(e) => patch({ requiredDisclaimers: linesToList(e.target.value) })}
        />
      </div>

      {onSave && !readOnly ? (
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save approval policy"}
        </Button>
      ) : null}
    </div>
  );
}
