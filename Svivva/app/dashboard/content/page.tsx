"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Eye, EyeOff, Plus, X, Loader2 } from "lucide-react";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SeoPage = {
  id: string;
  slug: string;
  keyword: string;
  title: string;
  headline: string;
  subheadline: string | null;
  content: string;
  benefits: string[];
  howItWorks: string;
  whoItsFor: string;
  relatedSlugs: string[];
  category: string;
  toolUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  published: boolean;
  createdAt: string;
};

type PageCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

type Tab = "blog" | "seo" | "categories";

const BLOG_CATEGORIES = ["guides", "tutorials", "technical", "business", "general"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function ContentManagementPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("blog");
  const [loading, setLoading] = useState(false);

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [seoPages, setSeoPages] = useState<SeoPage[]>([]);
  const [categories, setCategories] = useState<PageCategory[]>([]);

  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author: "Svivva Team",
    category: "general",
    tags: "",
    metaTitle: "",
    metaDescription: "",
    published: false,
  });

  const [showSeoForm, setShowSeoForm] = useState(false);
  const [editingSeo, setEditingSeo] = useState<SeoPage | null>(null);
  const [seoForm, setSeoForm] = useState({
    slug: "",
    keyword: "",
    title: "",
    headline: "",
    subheadline: "",
    content: "",
    benefit1: "",
    benefit2: "",
    benefit3: "",
    howItWorks: "",
    whoItsFor: "",
    relatedSlugs: "",
    category: "general",
    toolUrl: "",
    metaTitle: "",
    metaDescription: "",
    published: false,
  });

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchBlogPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/blog");
      if (res.ok) setBlogPosts(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  const fetchSeoPages = useCallback(async () => {
    try {
      const res = await fetch("/api/seo-pages");
      if (res.ok) setSeoPages(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/seo-pages/categories");
      if (res.ok) setCategories(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBlogPosts(), fetchSeoPages(), fetchCategories()]).finally(() =>
      setLoading(false)
    );
  }, [fetchBlogPosts, fetchSeoPages, fetchCategories]);

  const resetBlogForm = () => {
    setBlogForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      author: "Svivva Team",
      category: "general",
      tags: "",
      metaTitle: "",
      metaDescription: "",
      published: false,
    });
    setEditingBlog(null);
    setShowBlogForm(false);
  };

  const openBlogEdit = (post: BlogPost) => {
    setEditingBlog(post);
    setBlogForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      category: post.category,
      tags: post.tags.join(", "),
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      published: post.published,
    });
    setShowBlogForm(true);
  };

  const handleBlogSubmit = async () => {
    setSubmitting(true);
    const payload = {
      title: blogForm.title,
      slug: blogForm.slug,
      excerpt: blogForm.excerpt,
      content: blogForm.content,
      author: blogForm.author,
      category: blogForm.category,
      tags: blogForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      metaTitle: blogForm.metaTitle || null,
      metaDescription: blogForm.metaDescription || null,
      published: blogForm.published,
      publishedAt: blogForm.published ? new Date().toISOString() : null,
    };

    try {
      let res;
      if (editingBlog) {
        res = await fetch(`/api/blog/${editingBlog.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        toast({ title: editingBlog ? "Post updated" : "Post created" });
        resetBlogForm();
        fetchBlogPosts();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBlogPost = async (slug: string) => {
    if (!confirm("Delete this blog post?")) return;
    try {
      const res = await fetch(`/api/blog/${slug}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Post deleted" });
        fetchBlogPosts();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const toggleBlogPublish = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/blog/${post.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          published: !post.published,
          publishedAt: !post.published ? new Date().toISOString() : null,
        }),
      });
      if (res.ok) {
        toast({ title: post.published ? "Post unpublished" : "Post published" });
        fetchBlogPosts();
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const resetSeoForm = () => {
    setSeoForm({
      slug: "",
      keyword: "",
      title: "",
      headline: "",
      subheadline: "",
      content: "",
      benefit1: "",
      benefit2: "",
      benefit3: "",
      howItWorks: "",
      whoItsFor: "",
      relatedSlugs: "",
      category: "general",
      toolUrl: "",
      metaTitle: "",
      metaDescription: "",
      published: false,
    });
    setEditingSeo(null);
    setShowSeoForm(false);
  };

  const openSeoEdit = (page: SeoPage) => {
    setEditingSeo(page);
    setSeoForm({
      slug: page.slug,
      keyword: page.keyword,
      title: page.title,
      headline: page.headline,
      subheadline: page.subheadline || "",
      content: page.content,
      benefit1: page.benefits[0] || "",
      benefit2: page.benefits[1] || "",
      benefit3: page.benefits[2] || "",
      howItWorks: page.howItWorks,
      whoItsFor: page.whoItsFor,
      relatedSlugs: page.relatedSlugs.join(", "),
      category: page.category,
      toolUrl: page.toolUrl || "",
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      published: page.published,
    });
    setShowSeoForm(true);
  };

  const handleSeoSubmit = async () => {
    setSubmitting(true);
    const payload = {
      slug: seoForm.slug,
      keyword: seoForm.keyword,
      title: seoForm.title,
      headline: seoForm.headline,
      subheadline: seoForm.subheadline || null,
      content: seoForm.content,
      benefits: [seoForm.benefit1, seoForm.benefit2, seoForm.benefit3].filter(Boolean),
      howItWorks: seoForm.howItWorks,
      whoItsFor: seoForm.whoItsFor,
      relatedSlugs: seoForm.relatedSlugs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      category: seoForm.category,
      toolUrl: seoForm.toolUrl || null,
      metaTitle: seoForm.metaTitle || null,
      metaDescription: seoForm.metaDescription || null,
      published: seoForm.published,
    };

    try {
      let res;
      if (editingSeo) {
        res = await fetch(`/api/seo-pages/${editingSeo.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/seo-pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        toast({ title: editingSeo ? "Page updated" : "Page created" });
        resetSeoForm();
        fetchSeoPages();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSeoPage = async (slug: string) => {
    if (!confirm("Delete this SEO page?")) return;
    try {
      const res = await fetch(`/api/seo-pages/${slug}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Page deleted" });
        fetchSeoPages();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const toggleSeoPublish = async (page: SeoPage) => {
    try {
      const res = await fetch(`/api/seo-pages/${page.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !page.published }),
      });
      if (res.ok) {
        toast({ title: page.published ? "Page unpublished" : "Page published" });
        fetchSeoPages();
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", slug: "", description: "", metaTitle: "", metaDescription: "" });
    setShowCategoryForm(false);
  };

  const handleCategorySubmit = async () => {
    setSubmitting(true);
    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug,
      description: categoryForm.description || null,
      metaTitle: categoryForm.metaTitle || null,
      metaDescription: categoryForm.metaDescription || null,
    };
    try {
      const res = await fetch("/api/seo-pages/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "Category created" });
        resetCategoryForm();
        fetchCategories();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-sm font-medium text-muted-foreground mb-1";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground" data-testid="text-content-title">
        Content Management
      </h1>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "blog" ? "default" : "outline"}
          onClick={() => setActiveTab("blog")}
          data-testid="button-tab-blog"
        >
          Blog Posts
        </Button>
        <Button
          variant={activeTab === "seo" ? "default" : "outline"}
          onClick={() => setActiveTab("seo")}
          data-testid="button-tab-seo"
        >
          SEO Pages
        </Button>
        <Button
          variant={activeTab === "categories" ? "default" : "outline"}
          onClick={() => setActiveTab("categories")}
          data-testid="button-tab-categories"
        >
          Categories
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin w-4 h-4" />
          Loading...
        </div>
      )}

      {activeTab === "blog" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-foreground">Blog Posts</h2>
            <Button
              onClick={() => {
                resetBlogForm();
                setShowBlogForm(true);
              }}
              data-testid="button-new-blog-post"
            >
              <Plus className="w-4 h-4 mr-1" /> New Post
            </Button>
          </div>

          {showBlogForm && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">
                  {editingBlog ? "Edit Post" : "New Blog Post"}
                </CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={resetBlogForm}
                  data-testid="button-close-blog-form"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    className={inputClass}
                    value={blogForm.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setBlogForm((f) => ({
                        ...f,
                        title,
                        slug: editingBlog ? f.slug : slugify(title),
                      }));
                    }}
                    data-testid="input-blog-title"
                  />
                </div>
                <div>
                  <label className={labelClass}>Slug</label>
                  <input
                    className={inputClass}
                    value={blogForm.slug}
                    onChange={(e) => setBlogForm((f) => ({ ...f, slug: e.target.value }))}
                    data-testid="input-blog-slug"
                  />
                </div>
                <div>
                  <label className={labelClass}>Excerpt</label>
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={blogForm.excerpt}
                    onChange={(e) => setBlogForm((f) => ({ ...f, excerpt: e.target.value }))}
                    data-testid="input-blog-excerpt"
                  />
                </div>
                <div>
                  <label className={labelClass}>Content (Markdown)</label>
                  <textarea
                    className={inputClass}
                    rows={10}
                    value={blogForm.content}
                    onChange={(e) => setBlogForm((f) => ({ ...f, content: e.target.value }))}
                    data-testid="input-blog-content"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Author</label>
                    <input
                      className={inputClass}
                      value={blogForm.author}
                      onChange={(e) => setBlogForm((f) => ({ ...f, author: e.target.value }))}
                      data-testid="input-blog-author"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Category</label>
                    <select
                      className={inputClass}
                      value={blogForm.category}
                      onChange={(e) => setBlogForm((f) => ({ ...f, category: e.target.value }))}
                      data-testid="select-blog-category"
                    >
                      {BLOG_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Tags (comma-separated)</label>
                  <input
                    className={inputClass}
                    value={blogForm.tags}
                    onChange={(e) => setBlogForm((f) => ({ ...f, tags: e.target.value }))}
                    data-testid="input-blog-tags"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Meta Title</label>
                    <input
                      className={inputClass}
                      value={blogForm.metaTitle}
                      onChange={(e) => setBlogForm((f) => ({ ...f, metaTitle: e.target.value }))}
                      data-testid="input-blog-meta-title"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Meta Description</label>
                    <input
                      className={inputClass}
                      value={blogForm.metaDescription}
                      onChange={(e) =>
                        setBlogForm((f) => ({ ...f, metaDescription: e.target.value }))
                      }
                      data-testid="input-blog-meta-description"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={blogForm.published}
                    onChange={(e) => setBlogForm((f) => ({ ...f, published: e.target.checked }))}
                    data-testid="checkbox-blog-published"
                    className="rounded"
                  />
                  <label className="text-sm text-foreground">Published</label>
                </div>
                <Button
                  onClick={handleBlogSubmit}
                  disabled={submitting || !blogForm.title || !blogForm.slug}
                  data-testid="button-save-blog"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {editingBlog ? "Update Post" : "Create Post"}
                </Button>
              </CardContent>
            </Card>
          )}

          {blogPosts.length === 0 && !loading && (
            <p className="text-muted-foreground text-sm" data-testid="text-no-blog-posts">
              No blog posts found.
            </p>
          )}

          <div className="space-y-2">
            {blogPosts.map((post) => (
              <Card key={post.id} data-testid={`card-blog-post-${post.id}`}>
                <CardContent className="flex items-center justify-between gap-3 py-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        post.published ? "bg-green-500" : "bg-red-500"
                      }`}
                      data-testid={`status-blog-${post.id}`}
                    />
                    <div className="min-w-0">
                      <p
                        className="font-medium text-foreground truncate"
                        data-testid={`text-blog-title-${post.id}`}
                      >
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {post.category}
                        </Badge>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleBlogPublish(post)}
                      data-testid={`button-toggle-publish-blog-${post.id}`}
                    >
                      {post.published ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openBlogEdit(post)}
                      data-testid={`button-edit-blog-${post.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteBlogPost(post.slug)}
                      data-testid={`button-delete-blog-${post.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "seo" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-foreground">SEO Landing Pages</h2>
            <Button
              onClick={() => {
                resetSeoForm();
                setShowSeoForm(true);
              }}
              data-testid="button-new-seo-page"
            >
              <Plus className="w-4 h-4 mr-1" /> New Page
            </Button>
          </div>

          {showSeoForm && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">
                  {editingSeo ? "Edit SEO Page" : "New SEO Page"}
                </CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={resetSeoForm}
                  data-testid="button-close-seo-form"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Slug</label>
                    <input
                      className={inputClass}
                      value={seoForm.slug}
                      onChange={(e) => setSeoForm((f) => ({ ...f, slug: e.target.value }))}
                      data-testid="input-seo-slug"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Keyword</label>
                    <input
                      className={inputClass}
                      value={seoForm.keyword}
                      onChange={(e) => setSeoForm((f) => ({ ...f, keyword: e.target.value }))}
                      data-testid="input-seo-keyword"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    className={inputClass}
                    value={seoForm.title}
                    onChange={(e) => setSeoForm((f) => ({ ...f, title: e.target.value }))}
                    data-testid="input-seo-title"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Headline</label>
                    <input
                      className={inputClass}
                      value={seoForm.headline}
                      onChange={(e) => setSeoForm((f) => ({ ...f, headline: e.target.value }))}
                      data-testid="input-seo-headline"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Subheadline</label>
                    <input
                      className={inputClass}
                      value={seoForm.subheadline}
                      onChange={(e) => setSeoForm((f) => ({ ...f, subheadline: e.target.value }))}
                      data-testid="input-seo-subheadline"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Content (Markdown)</label>
                  <textarea
                    className={inputClass}
                    rows={8}
                    value={seoForm.content}
                    onChange={(e) => setSeoForm((f) => ({ ...f, content: e.target.value }))}
                    data-testid="input-seo-content"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Benefits (up to 3)</label>
                  <textarea
                    className={inputClass}
                    rows={2}
                    placeholder="Benefit 1"
                    value={seoForm.benefit1}
                    onChange={(e) => setSeoForm((f) => ({ ...f, benefit1: e.target.value }))}
                    data-testid="input-seo-benefit-1"
                  />
                  <textarea
                    className={inputClass}
                    rows={2}
                    placeholder="Benefit 2"
                    value={seoForm.benefit2}
                    onChange={(e) => setSeoForm((f) => ({ ...f, benefit2: e.target.value }))}
                    data-testid="input-seo-benefit-2"
                  />
                  <textarea
                    className={inputClass}
                    rows={2}
                    placeholder="Benefit 3"
                    value={seoForm.benefit3}
                    onChange={(e) => setSeoForm((f) => ({ ...f, benefit3: e.target.value }))}
                    data-testid="input-seo-benefit-3"
                  />
                </div>
                <div>
                  <label className={labelClass}>How It Works</label>
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={seoForm.howItWorks}
                    onChange={(e) => setSeoForm((f) => ({ ...f, howItWorks: e.target.value }))}
                    data-testid="input-seo-how-it-works"
                  />
                </div>
                <div>
                  <label className={labelClass}>Who It&apos;s For</label>
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={seoForm.whoItsFor}
                    onChange={(e) => setSeoForm((f) => ({ ...f, whoItsFor: e.target.value }))}
                    data-testid="input-seo-who-its-for"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Related Slugs (comma-separated)</label>
                    <input
                      className={inputClass}
                      value={seoForm.relatedSlugs}
                      onChange={(e) => setSeoForm((f) => ({ ...f, relatedSlugs: e.target.value }))}
                      data-testid="input-seo-related-slugs"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Category</label>
                    <select
                      className={inputClass}
                      value={seoForm.category}
                      onChange={(e) => setSeoForm((f) => ({ ...f, category: e.target.value }))}
                      data-testid="select-seo-category"
                    >
                      <option value="general">general</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Tool URL</label>
                  <input
                    className={inputClass}
                    value={seoForm.toolUrl}
                    onChange={(e) => setSeoForm((f) => ({ ...f, toolUrl: e.target.value }))}
                    data-testid="input-seo-tool-url"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Meta Title</label>
                    <input
                      className={inputClass}
                      value={seoForm.metaTitle}
                      onChange={(e) => setSeoForm((f) => ({ ...f, metaTitle: e.target.value }))}
                      data-testid="input-seo-meta-title"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Meta Description</label>
                    <input
                      className={inputClass}
                      value={seoForm.metaDescription}
                      onChange={(e) =>
                        setSeoForm((f) => ({ ...f, metaDescription: e.target.value }))
                      }
                      data-testid="input-seo-meta-description"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={seoForm.published}
                    onChange={(e) => setSeoForm((f) => ({ ...f, published: e.target.checked }))}
                    data-testid="checkbox-seo-published"
                    className="rounded"
                  />
                  <label className="text-sm text-foreground">Published</label>
                </div>
                <Button
                  onClick={handleSeoSubmit}
                  disabled={submitting || !seoForm.slug || !seoForm.keyword || !seoForm.title}
                  data-testid="button-save-seo"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {editingSeo ? "Update Page" : "Create Page"}
                </Button>
              </CardContent>
            </Card>
          )}

          {seoPages.length === 0 && !loading && (
            <p className="text-muted-foreground text-sm" data-testid="text-no-seo-pages">
              No SEO pages found.
            </p>
          )}

          <div className="space-y-2">
            {seoPages.map((page) => (
              <Card key={page.id} data-testid={`card-seo-page-${page.id}`}>
                <CardContent className="flex items-center justify-between gap-3 py-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        page.published ? "bg-green-500" : "bg-red-500"
                      }`}
                      data-testid={`status-seo-${page.id}`}
                    />
                    <div className="min-w-0">
                      <p
                        className="font-medium text-foreground truncate"
                        data-testid={`text-seo-keyword-${page.id}`}
                      >
                        {page.keyword}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {page.category}
                        </Badge>
                        <span className="truncate max-w-[200px]">/{page.slug}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleSeoPublish(page)}
                      data-testid={`button-toggle-publish-seo-${page.id}`}
                    >
                      {page.published ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openSeoEdit(page)}
                      data-testid={`button-edit-seo-${page.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteSeoPage(page.slug)}
                      data-testid={`button-delete-seo-${page.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-foreground">Page Categories</h2>
            <Button
              onClick={() => {
                resetCategoryForm();
                setShowCategoryForm(true);
              }}
              data-testid="button-new-category"
            >
              <Plus className="w-4 h-4 mr-1" /> New Category
            </Button>
          </div>

          {showCategoryForm && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">New Category</CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={resetCategoryForm}
                  data-testid="button-close-category-form"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input
                      className={inputClass}
                      value={categoryForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setCategoryForm((f) => ({ ...f, name, slug: slugify(name) }));
                      }}
                      data-testid="input-category-name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Slug</label>
                    <input
                      className={inputClass}
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm((f) => ({ ...f, slug: e.target.value }))}
                      data-testid="input-category-slug"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm((f) => ({ ...f, description: e.target.value }))
                    }
                    data-testid="input-category-description"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Meta Title</label>
                    <input
                      className={inputClass}
                      value={categoryForm.metaTitle}
                      onChange={(e) =>
                        setCategoryForm((f) => ({ ...f, metaTitle: e.target.value }))
                      }
                      data-testid="input-category-meta-title"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Meta Description</label>
                    <input
                      className={inputClass}
                      value={categoryForm.metaDescription}
                      onChange={(e) =>
                        setCategoryForm((f) => ({ ...f, metaDescription: e.target.value }))
                      }
                      data-testid="input-category-meta-description"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCategorySubmit}
                  disabled={submitting || !categoryForm.name || !categoryForm.slug}
                  data-testid="button-save-category"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Create Category
                </Button>
              </CardContent>
            </Card>
          )}

          {categories.length === 0 && !loading && (
            <p className="text-muted-foreground text-sm" data-testid="text-no-categories">
              No categories found.
            </p>
          )}

          <div className="space-y-2">
            {categories.map((cat) => (
              <Card key={cat.id} data-testid={`card-category-${cat.id}`}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p
                        className="font-medium text-foreground"
                        data-testid={`text-category-name-${cat.id}`}
                      >
                        {cat.name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {cat.slug}
                        </Badge>
                        {cat.description && <span className="truncate">{cat.description}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
