"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, RefreshCw, Send, Loader2 } from "lucide-react";

export type OrbitAssetRow = {
  id: string;
  title?: string | null;
  assetType: string;
  platform: string;
  approvalStatus: string;
  validationStatus: string;
  publishStatus: string;
  body: string;
  metadata?: Record<string, unknown> | null;
  validationResults?: { issues?: Array<{ message: string; severity: string }> } | null;
};

type Props = {
  campaignId: string;
  assets: OrbitAssetRow[];
  onRefresh?: () => void;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  rejected: "destructive",
  pending: "secondary",
  passed: "default",
  failed: "destructive",
  published: "default",
  scheduled: "secondary",
  ready_for_manual: "outline",
};

export function OrbitCampaignApprovalPanel({ campaignId, assets, onRefresh }: Props) {
  const qc = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: async ({
      assetId,
      action,
      processNow,
    }: {
      assetId: string;
      action: string;
      processNow?: boolean;
    }) => {
      const r = await authFetch(`/api/orbit/campaigns/${campaignId}/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, processNow }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-campaign", campaignId] });
      qc.invalidateQueries({ queryKey: ["orbit-campaign-assets", campaignId] });
      onRefresh?.();
    },
  });

  if (assets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No content assets yet. Generate assets from the campaign plan first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {assets.map((asset) => {
        const issues = asset.validationResults?.issues || [];
        const pending = actionMutation.isPending && actionMutation.variables?.assetId === asset.id;

        return (
          <Card key={asset.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{asset.title || asset.assetType}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {asset.platform} · {asset.assetType}
                    {asset.metadata?.phase ? ` · ${String(asset.metadata.phase)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={STATUS_VARIANT[asset.approvalStatus] || "outline"}>
                    {asset.approvalStatus}
                  </Badge>
                  <Badge variant={STATUS_VARIANT[asset.validationStatus] || "outline"}>
                    {asset.validationStatus}
                  </Badge>
                  <Badge variant={STATUS_VARIANT[asset.publishStatus] || "outline"}>
                    {asset.publishStatus}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="max-h-40 overflow-auto rounded-md bg-muted/50 p-3 text-xs whitespace-pre-wrap">
                {asset.body.slice(0, 1200)}
                {asset.body.length > 1200 ? "…" : ""}
              </pre>

              {issues.length > 0 ? (
                <ul className="space-y-1 text-sm text-amber-600 dark:text-amber-400">
                  {issues.map((issue, i) => (
                    <li key={i}>
                      {issue.severity}: {issue.message}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending || asset.approvalStatus === "approved"}
                  onClick={() => actionMutation.mutate({ assetId: asset.id, action: "approve" })}
                >
                  {pending ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                  )}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => actionMutation.mutate({ assetId: asset.id, action: "reject" })}
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => actionMutation.mutate({ assetId: asset.id, action: "revalidate" })}
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Revalidate
                </Button>
                <Button
                  size="sm"
                  disabled={pending || asset.approvalStatus !== "approved"}
                  onClick={() =>
                    actionMutation.mutate({
                      assetId: asset.id,
                      action: "publish",
                      processNow: true,
                    })
                  }
                >
                  <Send className="mr-1 h-3 w-3" />
                  Publish
                </Button>
              </div>

              {actionMutation.isError && actionMutation.variables?.assetId === asset.id ? (
                <p className="text-sm text-destructive">{String(actionMutation.error)}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
