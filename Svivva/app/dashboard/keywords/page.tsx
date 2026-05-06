"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Globe,
  FileText,
  Search,
  Loader2,
  ExternalLink,
  X,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Keyword = {
  id: string;
  keyword: string;
  searchVolume: number;
  intent: string;
  assignedPage: string | null;
  assignedArticle: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type KeywordForm = {
  keyword: string;
  searchVolume: number;
  intent: string;
  status: string;
  assignedPage: string;
  notes: string;
};

const emptyForm: KeywordForm = {
  keyword: "",
  searchVolume: 0,
  intent: "medium",
  status: "planned",
  assignedPage: "",
  notes: "",
};

export default function KeywordPlannerPage() {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<KeywordForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingLanding, setGeneratingLanding] = useState<Set<string>>(new Set());
  const [generatingArticle, setGeneratingArticle] = useState<Set<string>>(new Set());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch("/api/keywords");
      if (res.ok) setKeywords(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load keywords", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchKeywords(); }, [fetchKeywords]);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };

  const openEdit = (kw: Keyword) => {
    setEditingId(kw.id);
    setForm({ keyword: kw.keyword, searchVolume: kw.searchVolume, intent: kw.intent, status: kw.status, assignedPage: kw.assignedPage || "", notes: kw.notes || "" });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!form.keyword.trim()) return;
    setSubmitting(true);
    const payload = { keyword: form.keyword, searchVolume: form.searchVolume, intent: form.intent, status: form.status, assignedPage: form.assignedPage || null, notes: form.notes || null };
    try {
      const res = editingId
        ? await fetch(`/api/keywords/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/keywords", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast({ title: editingId ? "Keyword updated" : "Keyword added" });
        resetForm();
        fetchKeywords();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this keyword?")) return;
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Keyword deleted" }); fetchKeywords(); }
      else toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  const generateLandingPage = async (kw: Keyword) => {
    setGeneratingLanding((prev) => new Set(prev).add(kw.id));
    try {
      const res = await fetch("/api/generate/landing-page", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: kw.keyword, keywordId: kw.id }) });
      if (res.ok) { toast({ title: "Landing page generated" }); fetchKeywords(); }
      else { const err = await res.json(); toast({ title: "Error", description: err.error || "Generation failed", variant: "destructive" }); }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setGeneratingLanding((prev) => { const n = new Set(prev); n.delete(kw.id); return n; });
    }
  };

  const generateArticle = async (kw: Keyword) => {
    setGeneratingArticle((prev) => new Set(prev).add(kw.id));
    try {
      const res = await fetch("/api/generate/article", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: kw.keyword, keywordId: kw.id }) });
      if (res.ok) { toast({ title: "Article generated" }); fetchKeywords(); }
      else { const err = await res.json(); toast({ title: "Error", description: err.error || "Generation failed", variant: "destructive" }); }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setGeneratingArticle((prev) => { const n = new Set(prev); n.delete(kw.id); return n; });
    }
  };

  const filteredKeywords = keywords.filter((kw) => kw.keyword.toLowerCase().includes(searchQuery.toLowerCase()));

  const intentColor = (intent: string) => ({
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-gray-100 text-gray-600 border-gray-200",
  }[intent] ?? "bg-gray-100 text-gray-600 border-gray-200");

  const statusColor = (status: string) => ({
    published: "bg-green-100 text-green-700 border-green-200",
    writing: "bg-amber-100 text-amber-700 border-amber-200",
    planned: "bg-gray-100 text-gray-600 border-gray-200",
  }[status] ?? "bg-gray-100 text-gray-600 border-gray-200");

  const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-sm font-medium text-muted-foreground mb-1";

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-keyword-planner-title">
          Keyword Planner
        </h1>
        <p className="text-muted-foreground text-sm mt-1" data-testid="text-keyword-planner-subtitle">
          Manage your SEO keyword strategy
        </p>
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-keywords"
          />
        </div>
        <Button
          onClick={() => { resetForm(); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="flex-shrink-0"
          data-testid="button-add-keyword"
        >
          <Plus className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Add Keyword</span>
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-2 border-[#5BA8A0]/30">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">{editingId ? "Edit Keyword" : "Add Keyword"}</CardTitle>
            <Button size="icon" variant="ghost" onClick={resetForm} data-testid="button-cancel-keyword-form">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className={labelClass}>Keyword *</label>
              <input className={inputClass} value={form.keyword} onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))} placeholder="e.g. best api builder tools" data-testid="input-keyword" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Search Volume</label>
                <input type="number" className={inputClass} value={form.searchVolume} onChange={(e) => setForm((f) => ({ ...f, searchVolume: parseInt(e.target.value) || 0 }))} data-testid="input-search-volume" />
              </div>
              <div>
                <label className={labelClass}>Intent</label>
                <select className={inputClass} value={form.intent} onChange={(e) => setForm((f) => ({ ...f, intent: e.target.value }))} data-testid="select-intent">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} data-testid="select-status">
                  <option value="planned">Planned</option>
                  <option value="writing">Writing</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Assigned Page URL (optional)</label>
              <input className={inputClass} value={form.assignedPage} onChange={(e) => setForm((f) => ({ ...f, assignedPage: e.target.value }))} placeholder="e.g. /tools/api-builder" data-testid="input-assigned-page" />
            </div>
            <div>
              <label className={labelClass}>Notes (optional)</label>
              <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} data-testid="input-notes" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSubmit} disabled={submitting || !form.keyword.trim()} className="flex-1 sm:flex-none" data-testid="button-save-keyword">
                {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {editingId ? "Update Keyword" : "Save Keyword"}
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-keyword">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center" data-testid="loading-keywords">
          <Loader2 className="animate-spin w-5 h-5" /> Loading keywords...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredKeywords.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <TrendingUp className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground text-sm" data-testid="text-no-keywords">
            {searchQuery ? "No keywords match your search." : "No keywords yet. Add one to get started."}
          </p>
          {!searchQuery && (
            <Button onClick={() => { resetForm(); setShowForm(true); }} variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Add your first keyword
            </Button>
          )}
        </div>
      )}

      {/* Keyword cards — mobile-first */}
      {!loading && filteredKeywords.length > 0 && (
        <div className="space-y-2">
          {filteredKeywords.map((kw) => {
            const isExpanded = expandedCard === kw.id;
            return (
              <div
                key={kw.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
                data-testid={`row-keyword-${kw.id}`}
              >
                {/* Main row — always visible */}
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate" data-testid={`text-keyword-${kw.id}`}>
                      {kw.keyword}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${intentColor(kw.intent)}`}>
                        {kw.intent}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(kw.status)}`}>
                        {kw.status}
                      </span>
                      {kw.searchVolume > 0 && (
                        <span className="text-xs text-muted-foreground" data-testid={`text-volume-${kw.id}`}>
                          {kw.searchVolume.toLocaleString()}/mo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => generateLandingPage(kw)}
                      disabled={generatingLanding.has(kw.id)}
                      title="Generate landing page"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-[#5BA8A0] hover:bg-[#5BA8A0]/10 transition-colors disabled:opacity-40"
                      data-testid={`button-generate-landing-${kw.id}`}
                    >
                      {generatingLanding.has(kw.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => generateArticle(kw)}
                      disabled={generatingArticle.has(kw.id)}
                      title="Generate article"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-[#5BA8A0] hover:bg-[#5BA8A0]/10 transition-colors disabled:opacity-40"
                      data-testid={`button-generate-article-${kw.id}`}
                    >
                      {generatingArticle.has(kw.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : kw.id)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors"
                      data-testid={`button-expand-keyword-${kw.id}`}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-3 py-3 space-y-3 bg-muted/20">
                    {/* Links */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Landing Page</p>
                        {kw.assignedPage ? (
                          <a href={kw.assignedPage} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#5BA8A0] hover:underline truncate max-w-full"
                            data-testid={`link-landing-page-${kw.id}`}>
                            {kw.assignedPage} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        ) : (
                          <button onClick={() => generateLandingPage(kw)} disabled={generatingLanding.has(kw.id)}
                            className="text-xs text-[#5BA8A0] hover:underline flex items-center gap-1">
                            {generatingLanding.has(kw.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                            Generate page
                          </button>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Article</p>
                        {kw.assignedArticle ? (
                          <a href={kw.assignedArticle} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#5BA8A0] hover:underline truncate max-w-full"
                            data-testid={`link-article-${kw.id}`}>
                            {kw.assignedArticle} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        ) : (
                          <button onClick={() => generateArticle(kw)} disabled={generatingArticle.has(kw.id)}
                            className="text-xs text-[#5BA8A0] hover:underline flex items-center gap-1">
                            {generatingArticle.has(kw.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                            Generate article
                          </button>
                        )}
                      </div>
                    </div>
                    {kw.notes && (
                      <p className="text-xs text-muted-foreground italic">{kw.notes}</p>
                    )}
                    {/* Edit / Delete */}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-9" onClick={() => openEdit(kw)} data-testid={`button-edit-keyword-${kw.id}`}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-9 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDelete(kw.id)} data-testid={`button-delete-keyword-${kw.id}`}>
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary count */}
      {!loading && filteredKeywords.length > 0 && (
        <p className="text-xs text-center text-muted-foreground pb-4">
          {filteredKeywords.length} keyword{filteredKeywords.length !== 1 ? "s" : ""}
          {searchQuery ? ` matching "${searchQuery}"` : ""}
        </p>
      )}
    </div>
  );
}
