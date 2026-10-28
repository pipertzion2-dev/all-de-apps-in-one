import { db } from "@/lib/db";
import {
  inventionAuditEvents,
  inventionCollaborators,
  inventionComponents,
  inventionEvidence,
  inventionInventors,
  inventionTimelineEvents,
  inventionVerificationRecords,
  inventionVersions,
  inventions,
} from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import type { InventionBundle } from "./types";

/** Persist a private invention bundle for the owning user. Never public. */
export async function upsertInventionBundleForUser(
  userId: string,
  bundle: InventionBundle,
): Promise<void> {
  const inv = bundle.invention;
  const f = inv.fields;

  await db
    .insert(inventions)
    .values({
      id: inv.id,
      userId,
      title: f.title,
      description: f.description,
      category: f.category,
      status: inv.status,
      currentVersion: inv.currentVersion,
      documentationProgress: inv.documentationProgress,
      conceptionDate: f.conceptionDate || null,
      problemSolved: f.problemSolved || null,
      howItWorks: f.howItWorks || null,
      uniqueFeatures: f.uniqueFeatures || null,
      technicalSpecs: f.technicalSpecs || null,
      materials: f.materials || null,
      componentsText: f.componentsText || null,
      alternativeImplementations: f.alternativeImplementations || null,
      prototypeStatus: f.prototypeStatus,
      developmentHistory: f.developmentHistory || null,
      privacy: "private",
      fieldsJson: f,
      createdAt: new Date(inv.createdAt),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: inventions.id,
      set: {
        title: f.title,
        description: f.description,
        category: f.category,
        status: inv.status,
        currentVersion: inv.currentVersion,
        documentationProgress: inv.documentationProgress,
        conceptionDate: f.conceptionDate || null,
        problemSolved: f.problemSolved || null,
        howItWorks: f.howItWorks || null,
        uniqueFeatures: f.uniqueFeatures || null,
        technicalSpecs: f.technicalSpecs || null,
        materials: f.materials || null,
        componentsText: f.componentsText || null,
        alternativeImplementations: f.alternativeImplementations || null,
        prototypeStatus: f.prototypeStatus,
        developmentHistory: f.developmentHistory || null,
        privacy: "private",
        fieldsJson: f,
        updatedAt: new Date(),
      },
    });

  // Replace child rows for this invention owned by user (simple sync).
  await db.delete(inventionInventors).where(eq(inventionInventors.inventionId, inv.id));
  if (f.inventors.length) {
    await db.insert(inventionInventors).values(
      f.inventors.map((i) => ({
        inventionId: inv.id,
        name: i.name,
        email: i.email || null,
        role: i.role,
        contribution: i.contribution || null,
      })),
    );
  }

  await db.delete(inventionCollaborators).where(eq(inventionCollaborators.inventionId, inv.id));
  if (f.collaborators.length) {
    await db.insert(inventionCollaborators).values(
      f.collaborators.map((c) => ({
        id: c.id,
        inventionId: inv.id,
        name: c.name,
        role: c.role,
        email: c.email || null,
      })),
    );
  }

  for (const ver of bundle.versions) {
    await db
      .insert(inventionVersions)
      .values({
        id: ver.id,
        inventionId: inv.id,
        version: ver.version,
        label: ver.label,
        fieldsJson: ver.fields,
        contentHash: ver.contentHash,
        source: ver.source,
        note: ver.note || null,
        createdAt: new Date(ver.createdAt),
        serverTimestamp: new Date(),
      })
      .onConflictDoNothing();
  }

  for (const ev of bundle.evidence) {
    await db
      .insert(inventionEvidence)
      .values({
        id: ev.id,
        inventionId: inv.id,
        userId,
        originalFilename: ev.originalFilename,
        fileType: ev.fileType,
        byteLength: ev.byteLength,
        sha256: ev.sha256,
        version: ev.version,
        verificationStatus: ev.verificationStatus,
        storageKey: ev.blobKey || null,
        notes: ev.notes || null,
        uploadDate: new Date(ev.uploadDate),
        serverTimestamp: new Date(),
      })
      .onConflictDoNothing();
  }

  await db.delete(inventionComponents).where(eq(inventionComponents.inventionId, inv.id));
  if (bundle.components.length) {
    await db.insert(inventionComponents).values(
      bundle.components.map((c) => ({
        id: c.id,
        inventionId: inv.id,
        name: c.name,
        shape: c.shape,
        dimensionsJson: c.dimensions,
        positionJson: c.position,
        rotationJson: c.rotation,
        material: c.material,
        calloutNumber: c.calloutNumber ?? null,
        visible: c.visible,
      })),
    );
  }

  for (const tl of bundle.timeline.slice(0, 50)) {
    await db
      .insert(inventionTimelineEvents)
      .values({
        id: tl.id,
        inventionId: inv.id,
        title: tl.title,
        detail: tl.detail,
        kind: tl.kind,
        hash: tl.hash || null,
        at: new Date(tl.at),
        serverTimestamp: new Date(),
      })
      .onConflictDoNothing();
  }

  for (const aud of bundle.audit.slice(-50)) {
    await db
      .insert(inventionAuditEvents)
      .values({
        id: aud.id,
        inventionId: inv.id,
        event: aud.event,
        detail: aud.detail || null,
        prevHash: aud.prevHash || null,
        eventHash: aud.eventHash,
        createdAt: new Date(aud.at),
        serverTimestamp: new Date(),
      })
      .onConflictDoNothing();
  }

  // Authorized public ProofChain certificates only — never private descriptions.
  for (const cert of bundle.publicCerts || []) {
    await db
      .insert(inventionVerificationRecords)
      .values({
        id: cert.publicCertId,
        inventionId: inv.id,
        evidenceId: cert.evidenceId,
        method: `public_cert:${cert.publicCertId}`,
        status: "authorized",
        detail: JSON.stringify({
          inventionTitleAuthorized: cert.inventionTitleAuthorized,
          inventionTitle: cert.inventionTitleAuthorized ? cert.inventionTitle : undefined,
          originalFilename: cert.originalFilename,
          methodsClaimed: cert.methodsClaimed,
          issuedAt: cert.issuedAt,
        }),
        contentHash: cert.sha256,
        createdAt: new Date(cert.issuedAt),
        serverTimestamp: new Date(),
      })
      .onConflictDoNothing();
  }
}

export async function assertInventionOwner(userId: string, inventionId: string): Promise<boolean> {
  const rows = await db
    .select({ id: inventions.id })
    .from(inventions)
    .where(and(eq(inventions.id, inventionId), eq(inventions.userId, userId)))
    .limit(1);
  return rows.length > 0;
}
