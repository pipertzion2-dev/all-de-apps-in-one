"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Link2, Loader2, X } from "lucide-react";

interface Props {
  connected: boolean;
  credQueryKey?: string;
  compact?: boolean;
}

export function ReplitPATConnector({ connected, credQueryKey = "/api/seeds/credentials", compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function save() {
    const t = token.trim();
    if (!t) return;
    setSaving(true);
    try {
      const res = await authFetch("/api/seeds/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replitToken: t }),
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: [credQueryKey] });
      setToken("");
      setOpen(false);
      toast({ title: "Apps connected", description: "Your Personal Access Token has been saved." });
    } catch (e: any) {
      toast({ title: "Failed to save token", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      const res = await authFetch("/api/seeds/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replitToken: "" }),
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: [credQueryKey] });
      toast({ title: "Disconnected", description: "Token removed." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs ${connected ? "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300" : "bg-muted/40 text-muted-foreground border border-dashed border-border"}`}>
        <span className="flex items-center gap-1.5">
          {connected
            ? <><CheckCircle className="w-3 h-3 flex-shrink-0" /> Apps connected</>
            : <><Link2 className="w-3 h-3 flex-shrink-0" /> Apps not linked</>}
        </span>
        {connected ? (
          <button onClick={disconnect} disabled={disconnecting}
            className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 transition-colors"
            data-testid="button-disconnect-replit">
            {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Disconnect"}
          </button>
        ) : (
          <button onClick={() => setOpen(o => !o)}
            className="text-xs font-semibold px-2.5 py-0.5 rounded-md text-white shrink-0"
            style={{ background: "#5BA8A0" }}
            data-testid="button-connect-replit">
            Connect →
          </button>
        )}
        {open && !connected && (
          <PATForm token={token} setToken={setToken} saving={saving} onSave={save} onClose={() => setOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border px-4 py-3 text-xs flex items-start gap-2 ${connected ? "border-green-300 bg-green-50 dark:bg-green-950/20" : "border-amber-300 bg-amber-50 dark:bg-amber-950/20"}`}>
      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: connected ? "#16a34a" : "#d97706" }} />
      <div className="space-y-1.5 w-full">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className={`font-semibold ${connected ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300"}`}>
            {connected ? "✓ Apps connected" : "⚠ Apps not linked yet"}
          </p>
          {connected ? (
            <button onClick={disconnect} disabled={disconnecting}
              className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              data-testid="button-disconnect-replit">
              {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Disconnect"}
            </button>
          ) : (
            <button onClick={() => setOpen(o => !o)}
              className="text-xs font-semibold px-3 py-1 rounded-lg text-white shrink-0"
              style={{ background: "#5BA8A0" }}
              data-testid="button-connect-replit">
              {open ? "Cancel" : "Connect Apps →"}
            </button>
          )}
        </div>

        {!connected && open && (
          <PATForm token={token} setToken={setToken} saving={saving} onSave={save} onClose={() => setOpen(false)} />
        )}

        {connected && (
          <p className="text-muted-foreground">
            Account connected via Personal Access Token. Your apps can now be pulled automatically.
          </p>
        )}
        {!connected && !open && (
          <p className="text-muted-foreground">
            Click &ldquo;Connect Apps →&rdquo; and paste your Personal Access Token to link your account.
          </p>
        )}
      </div>
    </div>
  );
}

function PATForm({ token, setToken, saving, onSave, onClose }: {
  token: string;
  setToken: (v: string) => void;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-2 w-full space-y-2 rounded-xl border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground text-[11px]">Paste your Personal Access Token</p>
          <p className="text-muted-foreground text-[10px] mt-0.5">
            In your app platform account → open <strong>Settings</strong> → scroll past SSH Keys → find <strong>&ldquo;Personal Access Tokens&rdquo;</strong> → click <strong>+ Create token</strong> → copy &amp; paste it here.
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onSave()}
          placeholder="pat_xxxxxxxxxxxx…"
          className="flex-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-[11px] font-mono outline-none focus:ring-1 focus:ring-[#5BA8A0]"
          data-testid="input-replit-pat"
          autoFocus
        />
        <button
          onClick={onSave}
          disabled={saving || !token.trim()}
          className="px-3 py-1.5 rounded-lg text-white text-[11px] font-semibold disabled:opacity-50 shrink-0"
          style={{ background: "#5BA8A0" }}
          data-testid="button-save-replit-pat"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
        </button>
      </div>
    </div>
  );
}
