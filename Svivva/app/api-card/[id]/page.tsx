import { db } from "@/lib/db";
import { projects, projectVersions, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProjectCard(id: string) {
  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      description: projects.description,
      status: projects.status,
      ownerId: projects.ownerId,
      outputSchema: projects.outputSchema,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!projectRows[0]) return null;
  const project = projectRows[0];

  const versionRows = await db
    .select({
      version: projectVersions.version,
      systemPrompt: projectVersions.systemPrompt,
      createdAt: projectVersions.createdAt,
    })
    .from(projectVersions)
    .where(eq(projectVersions.projectId, id))
    .orderBy(desc(projectVersions.version))
    .limit(1);

  const ownerRows = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, project.ownerId))
    .limit(1);

  return {
    project,
    latestVersion: versionRows[0] || null,
    ownerName: ownerRows[0]?.name || "Anonymous",
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getProjectCard(id);
  if (!data) return { title: "API not found" };
  return {
    title: `${data.project.name} — Svivva API`,
    description: data.project.description || `A live AI API built with Svivva`,
  };
}

function StatusDot({ status }: { status: string }) {
  const color = status === "deployed" ? "#22c55e" : status === "draft" ? "#f59e0b" : "#94a3b8";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span style={{ background: color }} className="w-2 h-2 rounded-full inline-block" />
      <span style={{ color, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{status}</span>
    </span>
  );
}

export default async function ApiCardPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getProjectCard(id);
  if (!data) notFound();

  const { project, latestVersion, ownerName } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://svivva.com";
  const liveEndpoint = `${baseUrl}/api/run/${project.slug}`;

  const exampleCurl = `curl -X POST "${liveEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "your prompt here"}'`;

  const embedBadge = `<a href="${baseUrl}/api-card/${project.id}" target="_blank" rel="noopener">
  <img src="${baseUrl}/badge/svivva.svg" alt="Built with Svivva" />
</a>`;

  const schemaStr = JSON.stringify(project.outputSchema, null, 2);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e2e8f0", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #1e293b", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ color: "#5BA8A0", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>svivva</span>
          <span style={{ color: "#475569", fontSize: 13 }}>/</span>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>API Card</span>
        </Link>
        <Link href="/api/auth/login" style={{ padding: "6px 14px", borderRadius: 8, background: "linear-gradient(135deg, #5BA8A0, #6B2C4A)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          Build your own →
        </Link>
      </nav>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, margin: 0, letterSpacing: "-0.03em" }}>{project.name}</h1>
              {project.description && (
                <p style={{ color: "#94a3b8", marginTop: 8, fontSize: 15, lineHeight: 1.6, maxWidth: 560 }}>{project.description}</p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                <StatusDot status={project.status} />
                <span style={{ color: "#475569", fontSize: 12 }}>by {ownerName}</span>
                {latestVersion && (
                  <span style={{ color: "#475569", fontSize: 12 }}>v{latestVersion.version}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live endpoint */}
        <Section title="Live Endpoint">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ padding: "3px 8px", borderRadius: 4, background: "#16213e", color: "#5BA8A0", fontWeight: 700, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.05em" }}>POST</span>
            <code style={{ fontSize: 13, color: "#e2e8f0", fontFamily: "monospace", wordBreak: "break-all" }}>{liveEndpoint}</code>
          </div>
        </Section>

        {/* System Prompt */}
        {latestVersion && (
          <Section title="System Prompt">
            <pre style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.7, color: "#cbd5e1", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "monospace" }}>
              {latestVersion.systemPrompt}
            </pre>
          </Section>
        )}

        {/* Output Schema */}
        <Section title="Output Schema">
          <pre style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.7, color: "#a5f3fc", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "monospace" }}>
            {schemaStr}
          </pre>
        </Section>

        {/* cURL */}
        <Section title="Try it — cURL">
          <pre style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.7, color: "#86efac", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "monospace" }}>
            {exampleCurl}
          </pre>
        </Section>

        {/* Embed badge */}
        <Section title={`"Powered by Svivva" Badge`}>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 10 }}>Add this to your README or site to let people know how this API was built:</p>
          <pre style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 10, padding: 16, fontSize: 12, lineHeight: 1.7, color: "#fbbf24", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "monospace" }}>
            {embedBadge}
          </pre>
        </Section>

        {/* CTA */}
        <div style={{ marginTop: 48, padding: 24, borderRadius: 16, background: "linear-gradient(135deg, rgba(91,168,160,0.1), rgba(107,44,74,0.1))", border: "1px solid rgba(91,168,160,0.2)", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>Built with</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#5BA8A0", letterSpacing: "-0.02em", marginBottom: 8 }}>Svivva</p>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
            Turn any AI prompt into a production API — with schema enforcement, auto-evals, and one-click deploy.
          </p>
          <Link href="/api/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg, #5BA8A0, #6B2C4A)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Build your own AI API →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#475569", marginBottom: 8 }}>{title}</h2>
      {children}
    </div>
  );
}
