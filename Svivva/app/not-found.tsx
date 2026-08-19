import type { Metadata } from "next";
import Link from "next/link";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Page not found",
  description: "The page you requested does not exist on zzai zzai.",
  path: "/404",
  noindex: true,
});

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        This URL is not on zzai zzai. Try the homepage or browse tools and blog posts.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Home
        </Link>
        <Link href="/tools" className="rounded-md border px-4 py-2 text-sm font-medium">
          Tools
        </Link>
        <Link href="/blog" className="rounded-md border px-4 py-2 text-sm font-medium">
          Blog
        </Link>
      </div>
    </main>
  );
}
