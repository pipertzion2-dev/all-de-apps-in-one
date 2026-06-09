"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Wand2,
  ClipboardList,
} from "lucide-react";
import {
  formatFieldsForClipboard,
  type SubmissionField,
  type SubmissionItemDef,
} from "@/lib/orbit/submission-schemas";

const TEAL = "#5BA8A0";

type ItemState = {
  item: SubmissionItemDef;
  status: "pending" | "submitted" | "live" | "rejected";
  liveUrl: string | null;
  fields: Record<string, string>;
  aiFilledAt: string | null;
};

type WorkbenchData = {
  items: ItemState[];
  stats: { total: number; submitted: number; live: number; pending: number };
};

const KIND_TABS = [
  { id: "directory", label: "Directories", emoji: "📁" },
  { id: "publish", label: "Publishing", emoji: "✍️" },
  { id: "account", label: "Accounts", emoji: "🌐" },
] as const;

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: SubmissionField;
  value: string;
  onChange: (v: string) => void;
}) {
  const common = "text-xs";
  if (field.type === "textarea") {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={`min-h-[88px] ${common}`}
        maxLength={field.maxLength}
      />
    );
  }
  return (
    <Input
      type={field.type === "url" ? "url" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={`h-8 ${common}`}
      maxLength={field.maxLength}
    />
  );
}

function SubmissionCard({
  state,
  onRefresh,
}: {
  state: ItemState;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(state.status === "pending");
  const [fields, setFields] = useState(state.fields);
  const [liveUrl, setLiveUrl] = useState(state.liveUrl || "");
  const [copied, setCopied] = useState(false);

  const item = state.item;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const r = await authFetch("/api/orbit/submission-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", itemId: item.id, fields }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
    },
    onSuccess: () => {
      toast({ title: "Saved", duration: 2000 });
      onRefresh();
    },
  });

  const aiMutation = useMutation({
    mutationFn: async () => {
      const r = await authFetch("/api/orbit/submission-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ai_fill", itemId: item.id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      return data as { fields: Record<string, string> };
    },
    onSuccess: (data) => {
      setFields(data.fields);
      toast({ title: "AI filled all fields", duration: 2500 });
      onRefresh();
    },
    onError: (e) => toast({ title: "AI fill failed", description: String(e), variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: "submitted" | "live" | "pending") => {
      const r = await authFetch("/api/orbit/submission-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_status",
          itemId: item.id,
          status,
          liveUrl: liveUrl || undefined,
          fields,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
    },
    onSuccess: () => {
      onRefresh();
      toast({ title: "Status updated" });
    },
  });

  const copyAll = () => {
    const text = formatFieldsForClipboard(item, fields);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied — paste into the form", duration: 3000 });
    });
  };

  const statusStyle =
    state.status === "live"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : state.status === "submitted"
        ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
        : "bg-muted/30 text-muted-foreground";

  const busy = saveMutation.isPending || aiMutation.isPending || statusMutation.isPending;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/30"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
        <span className="text-xs font-bold flex-1 truncate">{item.label}</span>
        {item.estimatedVisitors && (
          <span className="text-[9px] text-muted-foreground shrink-0">
            {(item.estimatedVisitors / 1_000_000).toFixed(1)}M/mo
          </span>
        )}
        <Badge variant="outline" className={`text-[9px] shrink-0 ${statusStyle}`}>
          {state.status}
        </Badge>
      </button>

      {open && (
        <div className="border-t border-border px-3 py-3 space-y-3">
          {item.tip && (
            <p className="text-[10px] text-teal-700 dark:text-teal-400 leading-snug">💡 {item.tip}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1"
              disabled={busy}
              onClick={() => aiMutation.mutate()}
            >
              {aiMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
              AI fill
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={copyAll}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              Copy all
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px]"
              disabled={busy}
              onClick={() => saveMutation.mutate()}
            >
              Save draft
            </Button>
            <a
              href={item.submitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-border text-[10px] font-medium hover:bg-muted/40"
            >
              Open form <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2">
            {item.fields.map((field) => (
              <div key={field.key} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-semibold text-muted-foreground">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </label>
                  <button
                    type="button"
                    className="text-[9px] text-teal-600 hover:underline"
                    onClick={() => {
                      const v = fields[field.key] || "";
                      if (v) navigator.clipboard.writeText(v);
                    }}
                  >
                    Copy
                  </button>
                </div>
                <FieldInput
                  field={field}
                  value={fields[field.key] || ""}
                  onChange={(v) => setFields((prev) => ({ ...prev, [field.key]: v }))}
                />
                {field.hint && (
                  <p className="text-[9px] text-muted-foreground">{field.hint}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
            {state.status === "pending" && (
              <Button
                size="sm"
                className="h-7 text-[10px] text-white"
                style={{ background: TEAL }}
                disabled={busy}
                onClick={() => statusMutation.mutate("submitted")}
              >
                Mark submitted
              </Button>
            )}
            {state.status === "submitted" && (
              <>
                <Input
                  placeholder="Live listing URL (optional)"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  className="h-7 text-[10px] flex-1 min-w-[140px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] border-emerald-500/40 text-emerald-700"
                  disabled={busy}
                  onClick={() => statusMutation.mutate("live")}
                >
                  Mark live
                </Button>
              </>
            )}
            {state.status === "live" && state.liveUrl && (
              <a
                href={state.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-emerald-600 hover:underline inline-flex items-center gap-1"
              >
                View listing <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {state.aiFilledAt && (
              <span className="text-[9px] text-muted-foreground ml-auto">
                AI filled {new Date(state.aiFilledAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrbitSubmissionWorkbench({ defaultKind = "directory" }: { defaultKind?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [kind, setKind] = useState(defaultKind);

  const { data, isLoading } = useQuery<WorkbenchData>({
    queryKey: ["/api/orbit/submission-workbench", kind],
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/submission-workbench?kind=${kind}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 15_000,
  });

  const fillAllMutation = useMutation({
    mutationFn: async () => {
      const r = await authFetch("/api/orbit/submission-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ai_fill_all", kind }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error);
      return json;
    },
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orbit/submission-workbench"] });
      toast({
        title: `AI filled ${d.filled} items`,
        description: "Expand each card to review, then Copy all → paste on the site.",
        duration: 8000,
      });
    },
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/orbit/submission-workbench"] });

  const stats = data?.stats;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4" style={{ color: TEAL }} />
          <div>
            <p className="text-sm font-bold">Submission Workbench</p>
            <p className="text-[11px] text-muted-foreground">
              AI fills every field in Orbit — copy-paste into each site&apos;s form. No hunting links.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          disabled={fillAllMutation.isPending}
          onClick={() => fillAllMutation.mutate()}
          className="gap-1.5 text-white h-8 text-xs"
          style={{ background: `linear-gradient(135deg, ${TEAL}, #3d8a82)` }}
        >
          {fillAllMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          AI fill all {KIND_TABS.find((t) => t.id === kind)?.label.toLowerCase()}
        </Button>
      </div>

      {stats && (
        <div className="flex gap-2 text-[10px]">
          <Badge variant="outline">{stats.submitted}/{stats.total} submitted</Badge>
          <Badge variant="outline" className="bg-emerald-500/10">
            {stats.live} live
          </Badge>
          <Badge variant="outline">{stats.pending} remaining</Badge>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {KIND_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setKind(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              kind === t.id
                ? "bg-teal-500/15 border-teal-500/40 text-teal-800 dark:text-teal-200"
                : "border-border hover:bg-muted/40"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.items ?? []).map((state) => (
            <SubmissionCard key={state.item.id} state={state} onRefresh={refresh} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Workflow: <strong>AI fill</strong> → review fields → <strong>Copy all</strong> →{" "}
        <strong>Open form</strong> → paste → <strong>Mark submitted</strong>. Items with API keys
        in Autopilot (Dev.to, Twitter, etc.) can also auto-post on a full autopilot run.
      </p>
    </div>
  );
}
