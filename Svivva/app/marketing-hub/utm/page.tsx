"use client";
import { useState, useEffect } from "react";

export default function UtmPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    destinationUrl: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    utmContent: "",
  });
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/marketing/utm");
    setLinks(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (form.destinationUrl && form.utmSource && form.utmMedium && form.utmCampaign) {
      try {
        const url = new URL(form.destinationUrl);
        url.searchParams.set("utm_source", form.utmSource);
        url.searchParams.set("utm_medium", form.utmMedium);
        url.searchParams.set("utm_campaign", form.utmCampaign);
        if (form.utmTerm) url.searchParams.set("utm_term", form.utmTerm);
        if (form.utmContent) url.searchParams.set("utm_content", form.utmContent);
        setPreview(url.toString());
      } catch {
        setPreview("");
      }
    } else {
      setPreview("");
    }
  }, [form]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/marketing/utm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({
      name: "",
      destinationUrl: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmTerm: "",
      utmContent: "",
    });
    load();
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">UTM Builder</h2>
        <p className="text-sm text-muted-foreground">
          Build and track campaign URLs with UTM parameters
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Build a UTM URL</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Link Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Q3 Newsletter CTA"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Destination URL *
            </label>
            <input
              required
              type="url"
              value={form.destinationUrl}
              onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })}
              placeholder="https://svivva.com/pricing"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              utm_source *{" "}
              <span className="font-normal text-muted-foreground/70">
                e.g. newsletter, google, twitter
              </span>
            </label>
            <input
              required
              value={form.utmSource}
              onChange={(e) => setForm({ ...form, utmSource: e.target.value })}
              placeholder="newsletter"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              utm_medium *{" "}
              <span className="font-normal text-muted-foreground/70">e.g. email, cpc, social</span>
            </label>
            <input
              required
              value={form.utmMedium}
              onChange={(e) => setForm({ ...form, utmMedium: e.target.value })}
              placeholder="email"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              utm_campaign *{" "}
              <span className="font-normal text-muted-foreground/70">e.g. summer-sale, launch</span>
            </label>
            <input
              required
              value={form.utmCampaign}
              onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })}
              placeholder="q3-launch"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              utm_term{" "}
              <span className="font-normal text-muted-foreground/70">
                optional — paid search keywords
              </span>
            </label>
            <input
              value={form.utmTerm}
              onChange={(e) => setForm({ ...form, utmTerm: e.target.value })}
              placeholder="ai api platform"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              utm_content{" "}
              <span className="font-normal text-muted-foreground/70">
                optional — differentiate ads
              </span>
            </label>
            <input
              value={form.utmContent}
              onChange={(e) => setForm({ ...form, utmContent: e.target.value })}
              placeholder="hero-cta-button"
              className={inputClass}
            />
          </div>

          {preview && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Preview URL
              </label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground break-all font-mono">
                  {preview}
                </div>
                <button
                  type="button"
                  onClick={() => copy(preview, "preview")}
                  className="shrink-0 px-3 py-2 text-xs font-medium rounded-lg bg-muted hover:bg-muted/70 text-foreground border border-border transition-colors"
                >
                  {copied === "preview" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving..." : "Save UTM Link"}
            </button>
          </div>
        </form>
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-3">Saved Links</h3>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>No UTM links yet — build one above</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Name", "Source / Medium / Campaign", "Clicks", ""].map((h, i) => (
                  <th
                    key={i}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {links.map((link) => {
                const full = (() => {
                  try {
                    const url = new URL(link.destinationUrl);
                    url.searchParams.set("utm_source", link.utmSource);
                    url.searchParams.set("utm_medium", link.utmMedium);
                    url.searchParams.set("utm_campaign", link.utmCampaign);
                    if (link.utmTerm) url.searchParams.set("utm_term", link.utmTerm);
                    if (link.utmContent) url.searchParams.set("utm_content", link.utmContent);
                    return url.toString();
                  } catch {
                    return link.destinationUrl;
                  }
                })();
                return (
                  <tr key={link.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{link.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {link.destinationUrl}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <span className="font-mono">{link.utmSource}</span> /{" "}
                      <span className="font-mono">{link.utmMedium}</span> /{" "}
                      <span className="font-mono">{link.utmCampaign}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">{link.clicks ?? 0}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copy(full, link.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 text-foreground transition-colors font-medium"
                      >
                        {copied === link.id ? "Copied!" : "Copy URL"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
