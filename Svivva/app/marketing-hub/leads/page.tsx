"use client";
import { useState, useEffect } from "react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-orange-100 text-orange-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    source: "organic",
  });
  const [saving, setSaving] = useState(false);

  async function load(q?: string) {
    setLoading(true);
    const [leadsRes, statsRes] = await Promise.all([
      fetch(`/api/marketing/leads${q ? `?search=${encodeURIComponent(q)}` : ""}`),
      fetch("/api/marketing/leads?stats=true"),
    ]);
    setLeads(await leadsRes.json());
    setStats(await statsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/marketing/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ email: "", firstName: "", lastName: "", company: "", phone: "", source: "organic" });
    load();
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch("/api/marketing/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load(search || undefined);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search || undefined);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Leads</h2>
          <p className="text-sm text-muted-foreground">
            {stats?.total ?? 0} total · avg score {stats?.avgScore ?? 0}/100
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-80 transition-opacity"
        >
          {showForm ? "Cancel" : "+ Add Lead"}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: "New", value: stats.new, color: "text-blue-600" },
            { label: "Qualified", value: stats.qualified, color: "text-orange-600" },
            { label: "Converted", value: stats.converted, color: "text-green-600" },
            { label: "Avg Score", value: `${stats.avgScore}/100`, color: "text-foreground" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
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
          {[
            {
              key: "email",
              label: "Email *",
              placeholder: "name@company.com",
              required: true,
              type: "email",
            },
            { key: "firstName", label: "First Name", placeholder: "Alex" },
            { key: "lastName", label: "Last Name", placeholder: "Smith" },
            { key: "company", label: "Company", placeholder: "Acme Inc." },
            { key: "phone", label: "Phone", placeholder: "+1 555 000 0000" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {f.label}
              </label>
              <input
                required={f.required}
                type={f.type ?? "text"}
                value={(form as any)[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Source</label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              {["organic", "referral", "paid", "social", "email", "direct"].map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving..." : "Add Lead"}
            </button>
          </div>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, name, or company..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No leads found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Lead", "Company", "Source", "Score", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {lead.firstName} {lead.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.company ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {lead.source ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground rounded-full"
                          style={{ width: `${lead.score ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{lead.score ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className="text-xs rounded border border-border bg-background px-2 py-1 text-foreground focus:outline-none"
                    >
                      {["new", "contacted", "qualified", "converted", "lost"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
