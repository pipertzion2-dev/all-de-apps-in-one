"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import type { OrbitApprovalPolicy } from "@/lib/orbit/graph-constants";
import { DEFAULT_APPROVAL_POLICY } from "@/lib/orbit/campaign/approval-policy";
import { OrbitApprovalPolicyForm } from "@/components/orbit/orbit-approval-policy-form";
import {
  OrbitCampaignApprovalPanel,
  type OrbitAssetRow,
} from "@/components/orbit/orbit-campaign-approval-panel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

type Campaign = {
  id: string;
  name: string;
  status: string;
  phase: string;
  mode: string;
  objective: string;
  approvalPolicy?: OrbitApprovalPolicy | null;
  planSnapshot?: { phases?: unknown[] } | null;
};

export default function OrbitCampaignDetailPage() {
  const params = useParams();
  const campaignId = String(params.id);
  const qc = useQueryClient();
  const [draftPolicy, setDraftPolicy] = useState<OrbitApprovalPolicy | null>(null);

  const campaignQuery = useQuery<{ campaign: Campaign }>({
    queryKey: ["orbit-campaign", campaignId],
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/campaigns/${campaignId}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const assetsQuery = useQuery<{ assets: OrbitAssetRow[] }>({
    queryKey: ["orbit-campaign-assets", campaignId],
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/campaigns/${campaignId}/assets`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const campaign = campaignQuery.data?.campaign;
  const policy =
    draftPolicy ||
    (campaign?.approvalPolicy as OrbitApprovalPolicy | undefined) ||
    DEFAULT_APPROVAL_POLICY;

  const savePolicy = useMutation({
    mutationFn: async (approvalPolicy: OrbitApprovalPolicy) => {
      const r = await authFetch(`/api/orbit/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalPolicy }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => {
      setDraftPolicy(null);
      qc.invalidateQueries({ queryKey: ["orbit-campaign", campaignId] });
    },
  });

  const generateAssets = useMutation({
    mutationFn: async () => {
      const r = await authFetch(`/api/orbit/campaigns/${campaignId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateOnly: true }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-campaign-assets", campaignId] });
    },
  });

  const loading = campaignQuery.isLoading || assetsQuery.isLoading;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href="/dashboard/orbit/campaigns"
          className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          All campaigns
        </Link>

        {loading ? (
          <Skeleton className="h-10 w-2/3" />
        ) : campaign ? (
          <>
            <h1 className="text-2xl font-semibold">{campaign.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{campaign.status}</Badge>
              <Badge variant="secondary">{campaign.mode}</Badge>
              <Badge>{campaign.objective}</Badge>
              <Badge variant="outline">{campaign.phase}</Badge>
            </div>
          </>
        ) : (
          <p className="text-destructive">Campaign not found</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={generateAssets.isPending}
          onClick={() => generateAssets.mutate()}
        >
          {generateAssets.isPending ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-1 h-4 w-4" />
          )}
          Generate assets (template)
        </Button>
      </div>

      <Tabs defaultValue="approval">
        <TabsList>
          <TabsTrigger value="approval">Approval queue</TabsTrigger>
          <TabsTrigger value="policy">Approval policy</TabsTrigger>
        </TabsList>

        <TabsContent value="approval" className="mt-4">
          {assetsQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <OrbitCampaignApprovalPanel
              campaignId={campaignId}
              assets={assetsQuery.data?.assets || []}
              onRefresh={() => assetsQuery.refetch()}
            />
          )}
        </TabsContent>

        <TabsContent value="policy" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval policy</CardTitle>
              <CardDescription>
                Controls validation rules, rate limits, quiet hours, and publish gates for this
                campaign.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrbitApprovalPolicyForm
                policy={policy}
                onChange={setDraftPolicy}
                onSave={() => savePolicy.mutate(policy)}
                saving={savePolicy.isPending}
              />
              {savePolicy.isError ? (
                <p className="mt-3 text-sm text-destructive">{String(savePolicy.error)}</p>
              ) : null}
              {savePolicy.isSuccess ? (
                <p className="mt-3 text-sm text-emerald-600">Policy saved.</p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
