"use client";
import { useState, useEffect } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  running: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  concluded: "bg-blue-100 text-blue-800",
};

export default function AbTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", hypothesis: "", targetMetric: "conversion_rate" });
  const [variants, setVariants] = useState([
    { name: "Control", description: "" },
    { name: "Variant A", description: "" },
  ]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/marketing/ab-tests");
    setTests(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function addVariant() {
    setVariants([...variants, { name: `Variant ${String.fromCharCode(64 + variants.length)}`, description: "" }]);
  }

  function updateVariant(i: number, field: string, value: string) {
    setVariants(variants.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/marketing/ab-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, variants }),
    });
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/marketing/ab-tests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  function getWinnerVariant(test: any) {
    const variants = (test.variants as any[]) ?? [];
    if (!variants.length) return null;
    return variants.reduce((best: any, v: any) => {
      const rate = v.impressions > 0 ? v.conversions / v.impressions : 0;
      const bestRate = best.impressions > 0 ? best.conversions / best.impressions : 0;
      return rate > bestRate ? v : best;
    }, variants[0]);
  }

  const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">A/B Tests</h2>
          <p className="text-sm text-muted-foreground">Test variants and find what converts best</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-80 transition-opacity">
          {showForm ? "Cancel" : "+ New Test"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Test Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Homepage Hero CTA Test" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Hypothesis</label>
              <input value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })} placeholder="Changing the CTA from 'Sign up' to 'Start free' will increase clicks by 20%" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Target Metric</label>
              <select value={form.targetMetric} onChange={(e) => setForm({ ...form, targetMetric: e.target.value })} className={inputClass}>
                {["conversion_rate","click_rate","signup_rate","revenue","bounce_rate"].map((m) => <option key={m} value={m}>{m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Variants (min 2) *</label>
              <button type="button" onClick={addVariant} className="text-xs text-foreground hover:underline">+ Add Variant</button>
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input value={v.name} onChange={(e) => updateVariant(i, "name", e.target.value)} placeholder="Variant name" className="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20" />
                  <input value={v.description} onChange={(e) => updateVariant(i, "description", e.target.value)} placeholder="Description of this variant's change" className={`flex-1 ${inputClass}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-80 disabled:opacity-50 transition-opacity">
              {saving ? "Creating..." : "Create Test"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><p className="text-lg font-medium">No A/B tests yet</p><p className="text-sm mt-1">Create your first test to start optimizing</p></div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const vars = (test.variants as any[]) ?? [];
            const leader = getWinnerVariant(test);
            return (
              <div key={test.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-foreground">{test.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[test.status] ?? "bg-muted text-muted-foreground"}`}>{test.status}</span>
                    </div>
                    {test.hypothesis && <p className="text-xs text-muted-foreground">{test.hypothesis}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {test.status === "draft" && <button onClick={() => updateStatus(test.id, "running")} className="text-xs px-3 py-1 rounded-md bg-foreground text-background font-medium hover:opacity-80 transition-opacity">Start</button>}
                    {test.status === "running" && <button onClick={() => updateStatus(test.id, "paused")} className="text-xs px-3 py-1 rounded-md bg-muted text-foreground font-medium border border-border">Pause</button>}
                    {test.status === "paused" && <button onClick={() => updateStatus(test.id, "running")} className="text-xs px-3 py-1 rounded-md bg-foreground text-background font-medium hover:opacity-80 transition-opacity">Resume</button>}
                    {(test.status === "running" || test.status === "paused") && <button onClick={() => updateStatus(test.id, "concluded")} className="text-xs px-3 py-1 rounded-md border border-border text-muted-foreground font-medium hover:text-foreground transition-colors">Conclude</button>}
                  </div>
                </div>

                <div className="space-y-2">
                  {vars.map((v: any) => {
                    const rate = v.impressions > 0 ? ((v.conversions / v.impressions) * 100).toFixed(1) : "0.0";
                    const isLeader = leader?.id === v.id && v.impressions > 0;
                    return (
                      <div key={v.id} className={`rounded-lg p-3 border ${isLeader ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-border bg-muted/30"}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{v.name}</span>
                            {isLeader && test.status !== "draft" && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-medium">Leading</span>}
                          </div>
                          <span className="text-sm font-bold text-foreground">{rate}%</span>
                        </div>
                        {v.description && <p className="text-xs text-muted-foreground mb-1.5">{v.description}</p>}
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${isLeader ? "bg-green-500" : "bg-foreground/40"}`} style={{ width: `${Math.min(parseFloat(rate) * 5, 100)}%` }} />
                        </div>
                        <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                          <span>{v.impressions ?? 0} impressions</span>
                          <span>{v.conversions ?? 0} conversions</span>
                          <span>{v.traffic ?? 0}% traffic</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
