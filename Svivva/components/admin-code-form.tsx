"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Loader2 } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  onSuccess?: () => void;
};

export function AdminCodeForm({
  title = "Access code",
  description = "Enter your access code to unlock Pro (digital + hardware) or admin tools.",
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        setError("Incorrect code");
        setCode("");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stripe/subscription"] });
      onSuccess?.();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 max-w-sm mx-auto text-center space-y-4">
      <KeyRound className="w-8 h-8 mx-auto text-muted-foreground" />
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <Input
        type="password"
        inputMode="numeric"
        maxLength={6}
        placeholder="•••"
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
          setError("");
        }}
        onKeyDown={(e) => e.key === "Enter" && code.length >= 3 && void submit()}
        className="text-center text-lg tracking-[0.35em] font-mono"
        data-testid="input-admin-code"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        className="w-full"
        disabled={loading || code.length < 3}
        onClick={() => void submit()}
        data-testid="button-admin-code-submit"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock"}
      </Button>
    </div>
  );
}
