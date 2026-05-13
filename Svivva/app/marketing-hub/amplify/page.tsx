"use client";
import { useState, useEffect } from "react";

const CHANNELS = [
  { id: "twitter", label: "Twitter / X", emoji: "𝕏" },
  { id: "linkedin", label: "LinkedIn", emoji: "in" },
  { id: "email", label: "Email", emoji: "✉" },
  { id: "instagram", label: "Instagram", emoji: "📷" },
  { id: "facebook", label: "Facebook", emoji: "f" },
];

export default function AmplifyPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [selectedChannels, setSelectedChannels] = useState(["twitter", "linkedin", "email"]);
  const [amplifying, setAmplifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/marketing/amplify");
    setJobs(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function toggleChannel(id: string) {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handleAmplify(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || selectedChannels.length === 0) return;
    setAmplifying(true);
    setResult(null);
    const res = await fetch("/api/marketing/amplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceContent: content,
        channels: selectedChannels,
        sourceType: "custom",
      }),
    });
    const data = await res.json();
    setResult(data);
    setAmplifying(false);
    load();
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Content Amplifier</h2>
        <p className="text-sm text-muted-foreground">
          Paste any content and instantly repurpose it for every marketing channel using AI
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <form onSubmit={handleAmplify} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Source Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Paste your blog post, product description, announcement, or any marketing copy here..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {content.length} chars
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Target Channels *
            </label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleChannel(ch.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedChannels.includes(ch.id)
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={amplifying || !content.trim() || selectedChannels.length === 0}
            className="w-full py-2.5 text-sm font-semibold bg-foreground text-background rounded-lg hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            {amplifying
              ? "Amplifying with AI..."
              : `Amplify to ${selectedChannels.length} channel${selectedChannels.length !== 1 ? "s" : ""}`}
          </button>
        </form>
      </div>

      {amplifying && (
        <div className="rounded-xl border border-border bg-card p-8 text-center mb-6">
          <div className="text-muted-foreground text-sm animate-pulse">
            AI is generating content for each channel...
          </div>
        </div>
      )}

      {result && result.outputs && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-3">Generated Content</h3>
          <div className="space-y-4">
            {result.outputs.map((output: any) => (
              <div
                key={output.channel}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted border-b border-border">
                  <span className="text-sm font-semibold text-foreground capitalize">
                    {output.channel}
                  </span>
                  {output.status === "done" ? (
                    <button
                      onClick={() => copy(output.content, output.channel)}
                      className="text-xs px-3 py-1 rounded-md bg-background border border-border text-foreground hover:bg-muted transition-colors font-medium"
                    >
                      {copied === output.channel ? "Copied!" : "Copy"}
                    </button>
                  ) : (
                    <span className="text-xs text-red-500 font-medium">Failed</span>
                  )}
                </div>
                <div className="px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {output.content || "No content generated"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-foreground mb-3">Amplification History</h3>
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>No amplification jobs yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.slice(0, 10).map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground truncate">
                  {job.sourceContent?.slice(0, 80)}...
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {job.channels?.join(", ")} · {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${job.status === "done" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}
              >
                {job.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
