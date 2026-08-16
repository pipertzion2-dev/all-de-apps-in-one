"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authFetch, redirectToLogin } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, User, Loader2, X, Zap, LogIn } from "lucide-react";

interface Props {
  connected: boolean;
  username?: string | null;
  credQueryKey?: string;
  compact?: boolean;
}

export function ReplitUsernameConnector({
  connected,
  username: savedUsername,
  credQueryKey = "/api/seeds/credentials",
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoConnecting, setAutoConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function handle401() {
    setSessionExpired(true);
  }

  async function autoConnect() {
    setAutoConnecting(true);
    setSessionExpired(false);
    try {
      const res = await authFetch("/api/seeds/replit-autoconnect", { method: "POST" });
      if (res.status === 401) {
        handle401();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      queryClient.invalidateQueries({ queryKey: [credQueryKey] });
      toast({ title: "Apps connected!", description: `Auto-detected username @${data.username}.` });
    } catch (e: any) {
      toast({ title: "Auto-connect failed", description: e.message, variant: "destructive" });
    } finally {
      setAutoConnecting(false);
    }
  }

  async function save() {
    const u = username.trim().replace(/^@/, "");
    if (!u) return;
    setSaving(true);
    setSessionExpired(false);
    try {
      const res = await authFetch("/api/seeds/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replitUsername: u }),
      });
      if (res.status === 401) {
        handle401();
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: [credQueryKey] });
      setUsername("");
      setOpen(false);
      toast({ title: "Apps connected", description: `Username @${u} saved.` });
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
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
        body: JSON.stringify({ replitUsername: "" }),
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: [credQueryKey] });
      toast({ title: "Disconnected", description: "Username removed." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  }

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs ${connected ? "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300" : "bg-muted/40 text-muted-foreground border border-dashed border-border"}`}
      >
        <span className="flex items-center gap-1.5">
          {connected ? (
            <>
              <CheckCircle className="w-3 h-3 flex-shrink-0" /> @{savedUsername}
            </>
          ) : (
            <>
              <User className="w-3 h-3 flex-shrink-0" /> Apps not linked
            </>
          )}
        </span>
        {connected ? (
          <button
            onClick={disconnect}
            disabled={disconnecting}
            className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 transition-colors"
            data-testid="button-disconnect-replit"
          >
            {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Disconnect"}
          </button>
        ) : (
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-xs font-semibold px-2.5 py-0.5 rounded-md text-white shrink-0"
            style={{ background: "#5BA8A0" }}
            data-testid="button-connect-replit"
          >
            Connect →
          </button>
        )}
        {open && !connected && (
          <UsernameForm
            username={username}
            setUsername={setUsername}
            saving={saving}
            onSave={save}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-xs flex items-start gap-2 ${connected ? "border-green-300 bg-green-50 dark:bg-green-950/20" : "border-amber-300 bg-amber-50 dark:bg-amber-950/20"}`}
    >
      <CheckCircle
        className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
        style={{ color: connected ? "#16a34a" : "#d97706" }}
      />
      <div className="space-y-1.5 w-full">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p
            className={`font-semibold ${connected ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300"}`}
          >
            {connected ? `✓ Connected as @${savedUsername}` : "⚠ Apps not linked yet"}
          </p>
          {connected ? (
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              data-testid="button-disconnect-replit"
            >
              {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Disconnect"}
            </button>
          ) : null}
        </div>

        {sessionExpired && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 px-3 py-2.5 space-y-2">
            <p className="text-red-700 dark:text-red-300 font-semibold text-[11px]">
              Session expired — please log in again
            </p>
            <p className="text-red-600/80 dark:text-red-400/80 text-[10px]">
              Your login session has expired. Logging back in takes 5 seconds and will automatically
              link your account.
            </p>
            <button
              onClick={() => redirectToLogin()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold"
              style={{ background: "#6B2C4A" }}
              data-testid="button-relogin"
            >
              <LogIn className="w-3.5 h-3.5" /> Log in again
            </button>
          </div>
        )}

        {!connected && !sessionExpired && (
          <div className="space-y-2 mt-1">
            <button
              onClick={autoConnect}
              disabled={autoConnecting}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-60 transition-all active:scale-95"
              style={{ background: "#F26207" }}
              data-testid="button-autoconnect-replit"
            >
              {autoConnecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting…
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" /> Auto-connect from this environment
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-muted-foreground">or</p>
            <button
              onClick={() => setOpen((o) => !o)}
              className="w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
              data-testid="button-connect-replit-manual"
            >
              {open ? "Cancel manual entry" : "Enter username manually →"}
            </button>
            {open && (
              <UsernameForm
                username={username}
                setUsername={setUsername}
                saving={saving}
                onSave={save}
                onClose={() => setOpen(false)}
              />
            )}
          </div>
        )}

        {connected && (
          <p className="text-muted-foreground">
            Your public apps are accessible from the Orbit picker.
          </p>
        )}
      </div>
    </div>
  );
}

function UsernameForm({
  username,
  setUsername,
  saving,
  onSave,
  onClose,
}: {
  username: string;
  setUsername: (v: string) => void;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-2 w-full space-y-2 rounded-xl border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground text-[11px]">
            Enter your app platform username
          </p>
          <p className="text-muted-foreground text-[10px] mt-0.5">
            Just your username — no token needed. Find it in the top-left corner of your app
            platform dashboard when logged in.
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave()}
          placeholder="your-username"
          className="flex-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-[11px] font-mono outline-none focus:ring-1 focus:ring-[#5BA8A0]"
          data-testid="input-replit-username"
          autoFocus
        />
        <button
          onClick={onSave}
          disabled={saving || !username.trim()}
          className="px-3 py-1.5 rounded-lg text-white text-[11px] font-semibold disabled:opacity-50 shrink-0"
          style={{ background: "#5BA8A0" }}
          data-testid="button-save-replit-username"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
        </button>
      </div>
    </div>
  );
}
