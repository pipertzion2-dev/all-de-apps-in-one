"use client";
import { useState, useEffect } from "react";
import { CampaignCard } from "@/components/marketing/CampaignCard";

const CHANNELS = ["email", "social", "seo", "paid", "referral", "content"];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    channel: "email",
    budget: "",
    targetAudience: "",
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);

  async function loadCampaigns() {
    setLoading(true);
    const res = await fetch("/api/marketing/campaigns");
    const data = await res.json();
    setCampaigns(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/marketing/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, budget: form.budget ? parseFloat(form.budget) : undefined }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({
      name: "",
      description: "",
      channel: "email",
      budget: "",
      targetAudience: "",
      startDate: "",
      endDate: "",
    });
    loadCampaigns();
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch("/api/marketing/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadCampaigns();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Campaigns</h2>
          <p className="text-sm text-muted-foreground">{campaigns.length} total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-80 transition-opacity"
        >
          {showForm ? "Cancel" : "+ New Campaign"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Campaign Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Summer Email Blast"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Channel *
            </label>
            <select
              required
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Budget ($)
            </label>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="5000"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Target Audience
            </label>
            <input
              value={form.targetAudience}
              onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
              placeholder="Developers, 25-40, interested in AI tools"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="What is this campaign about?"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No campaigns yet</p>
          <p className="text-sm mt-1">Create your first campaign to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
