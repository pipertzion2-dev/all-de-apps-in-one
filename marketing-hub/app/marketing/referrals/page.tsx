"use client";
import { useState, useEffect } from "react";

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    referrerId: "",
    referrerEmail: "",
    rewardType: "credit",
    rewardAmount: "10",
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [rRes, sRes] = await Promise.all([
      fetch("/api/marketing/referrals"),
      fetch("/api/marketing/referrals?stats=true"),
    ]);
    setReferrals(await rRes.json());
    setStats(await sRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/marketing/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rewardAmount: parseFloat(form.rewardAmount) }),
    });
    setSaving(false);
    setShowForm(false);
    load();
  }

  function copyLink(link: string, id: string) {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Referral Program</h2>
          <p className="text-sm text-muted-foreground">
            Create viral referral links and track performance
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-80 transition-opacity"
        >
          {showForm ? "Cancel" : "+ Create Referral"}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Active Links", value: stats.active },
            { label: "Total Clicks", value: stats.totalClicks },
            { label: "Signups", value: stats.totalSignups },
            { label: "Conversion Rate", value: `${stats.conversionRate}%` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-5 rounded-xl border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Referrer Email *
            </label>
            <input
              required
              type="email"
              value={form.referrerEmail}
              onChange={(e) => setForm({ ...form, referrerEmail: e.target.value })}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Referrer ID *
            </label>
            <input
              required
              value={form.referrerId}
              onChange={(e) => setForm({ ...form, referrerId: e.target.value })}
              placeholder="user-uuid or user-id"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Reward Type
            </label>
            <select
              value={form.rewardType}
              onChange={(e) => setForm({ ...form, rewardType: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              {["credit", "discount", "cash", "gift"].map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Reward Amount
            </label>
            <input
              type="number"
              value={form.rewardAmount}
              onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })}
              placeholder="10"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Generating..." : "Generate Referral Link"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No referrals yet</p>
          <p className="text-sm mt-1">Generate a referral link to start your program</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                    {r.referralCode}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.referrerEmail}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "active" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{r.referralLink}</div>
              </div>
              <div className="flex items-center gap-4 text-center shrink-0">
                {[
                  { label: "Clicks", value: r.clicks },
                  { label: "Signups", value: r.signups },
                  { label: "Conversions", value: r.conversions },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="text-sm font-bold text-foreground">{m.value ?? 0}</div>
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                  </div>
                ))}
                <button
                  onClick={() => copyLink(r.referralLink, r.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/70 text-foreground transition-colors"
                >
                  {copied === r.id ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
