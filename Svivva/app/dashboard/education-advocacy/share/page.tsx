"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SelectiveSharePage() {
  const [pkgRaw, setPkgRaw] = useState("");
  const [profile, setProfile] = useState("counselor");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");

  const share = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/education-advocacy/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: JSON.parse(pkgRaw), profile }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch {
      setResult(JSON.stringify({ error: "Invalid package JSON" }, null, 2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-8 pb-16 max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Selective sharing</h1>
        <p className="text-sm text-muted-foreground">
          Create a limited disclosure package. Each export gets its own manifest and hash — you do
          not have to share the entire vault.
        </p>
      </div>
      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Authorized packet</CardTitle>
          <CardDescription>
            Counselor, legal advocate, and scholarship profiles disclose different fields by
            default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={profile} onValueChange={setProfile}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="counselor">Counselor</SelectItem>
              <SelectItem value="legal_advocate">Legal advocate</SelectItem>
              <SelectItem value="scholarship">Scholarship organization</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            rows={10}
            className="font-mono text-xs"
            value={pkgRaw}
            onChange={(e) => setPkgRaw(e.target.value)}
            placeholder="Paste EPV package JSON"
          />
          <Button onClick={() => void share()} disabled={busy || !pkgRaw.trim()} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create limited package
          </Button>
          {result ? (
            <pre className="text-[10px] overflow-auto max-h-80 p-3 rounded bg-black/30">
              {result}
            </pre>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
